document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const selectTurma = document.getElementById('selectTurma');
    const tabelaRelatorio = document.getElementById('tabelaRelatorio').querySelector('tbody');

    // Dados
    let frequenciaData = {};
    let registrosDeSaida = [];
    const turmas = [
        '6º ANO TURMA A', '6º ANO TURMA B', '7º ANO TURMA A', '7º ANO TURMA B',
        '8º ANO TURMA A', '8º ANO TURMA B', '8º ANO TURMA C', '9º ANO TURMA A', '9º ANO TURMA B',
        '1º SERIE -A', '1º SERIE -B', '2º ADM', '2º SERIE -B LGH',
        '3º SERIE A CNT', '3º SERIE B LGH', '3º SERIE VENDAS'
    ];
    const disciplinasExcluidas = ['ALMOÇO', 'CAFÉ', 'LANCHE', 'TUTORIA', 'CAFÉ DA MANHÃ'];
    const disciplinasSemProfessor = ['ELETIVA', 'CLUBE'];

    // Inicialização
    init();

    function init() {
        // Carregar dados do localStorage
        frequenciaData = JSON.parse(localStorage.getItem('frequencia')) || {};
        registrosDeSaida = JSON.parse(localStorage.getItem('registrosDeSaida')) || [];

        // Popular o seletor de turmas
        selectTurma.innerHTML = '<option value="">Selecione uma turma</option>' +
            turmas.map(turma => `<option value="${turma}">${turma}</option>`).join('');

        // Evento de mudança na seleção de turma
        selectTurma.addEventListener('change', () => {
            const turmaSelecionada = selectTurma.value;
            if (turmaSelecionada) {
                gerarRelatorioTurma(turmaSelecionada);
            } else {
                tabelaRelatorio.innerHTML = ''; // Limpar tabela se nenhuma turma for selecionada
            }
        });
    }

    async function gerarRelatorioTurma(turma) {
        if (!frequenciaData[turma]) {
            tabelaRelatorio.innerHTML = '<tr><td colspan="3">Nenhum dado de frequência para esta turma.</td></tr>';
            return;
        }

        // Ordenar alunos alfabeticamente
        const alunos = frequenciaData[turma].sort((a, b) => a.nome.localeCompare(b.nome));
        tabelaRelatorio.innerHTML = ''; // Limpar tabela

        // Para cada aluno, calcular os dados
        for (const [index, aluno] of alunos.entries()) {
            const frequenciaPercentual = calcPercentual(aluno);
            const numeroSaidas = contarSaidas(aluno.nome, turma);
            const disciplinasAfetadas = await obterDisciplinasAfetadas(aluno, turma);

            // Adicionar linha à tabela com acordeão
            const row = document.createElement('tr');
            row.classList.add('aluno-row');
            row.innerHTML = `
                <td>
                    <div class="aluno-info">
                        <span class="expand-indicator" onclick="toggleRelatorioAluno('${turma.replace(/\s+/g, '-')}', ${index})"></span>
                        <span class="aluno-nome" onclick="toggleRelatorioAluno('${turma.replace(/\s+/g, '-')}', ${index})">${aluno.nome}</span>
                    </div>
                    <div class="relatorio-individual aluno-${turma.replace(/\s+/g, '-')}-${index}">
                        <div class="disciplinas-lista">
                            ${disciplinasAfetadas.length > 0 ?
                                disciplinasAfetadas.map(item => `<span class="disciplina">${item}</span>`).join('') :
                                '<span>Nenhuma disciplina afetada</span>'}
                        </div>
                    </div>
                </td>
                <td class="${frequenciaPercentual < 75 ? 'warning' : ''}">${frequenciaPercentual}%</td>
                <td>${numeroSaidas}</td>
            `;
            tabelaRelatorio.appendChild(row);
        }
    }

    // Função para calcular o percentual de frequência (reaproveitada do frequencia.js)
    function calcPercentual(aluno) {
        const registros = Object.values(aluno.presencas);
        if (registros.length === 0) return 0;

        const diasValidos = registros.filter(p => p !== 'atestado');
        const presentes = diasValidos.filter(p => p === 'presente').length;

        return diasValidos.length > 0
            ? ((presentes / diasValidos.length) * 100).toFixed(1)
            : 0;
    }

    // Função para contar o número de saídas antecipadas de um aluno
    function contarSaidas(nomeAluno, turma) {
        return registrosDeSaida.filter(registro =>
            registro.alunoNome === nomeAluno && registro.sala === turma
        ).length;
    }

    // Função para obter as disciplinas afetadas por faltas e saídas
    async function obterDisciplinasAfetadas(aluno, turma) {
        const disciplinasAfetadas = [];

        // 1. Disciplinas perdidas por faltas
        const diasDeFalta = Object.entries(aluno.presencas)
            .filter(([_, status]) => status === 'falta')
            .map(([data, _]) => data)
            .sort();

        for (const data of diasDeFalta) {
            const diaDaSemana = obterDiaDaSemanaParaCSV(data);
            if (diaDaSemana === 'saturday' || diaDaSemana === 'sunday') continue;

            const aulasDoDia = await carregarAulasDoDia(diaDaSemana, turma);
            const aulasFiltradas = aulasDoDia.filter(aula => !disciplinasExcluidas.includes(aula.subject));

            if (aulasFiltradas.length > 0) {
                const dataFormatada = converterDataParaFormato(data);
                const textoFalta = `${dataFormatada} (Falta): `;
                const disciplinasTexto = aulasFiltradas.map(aula => {
                    const professor = disciplinasSemProfessor.includes(aula.subject) ? '' : aula.teacher;
                    return `${aula.subject} / ${professor}`;
                }).filter(texto => {
                    // Garante que disciplinas excluídas não apareçam no texto final
                    return !disciplinasExcluidas.some(excluida => texto.toUpperCase().startsWith(excluida + ' /'));
                }).join(', ');

                if (disciplinasTexto) {
                    disciplinasAfetadas.push(`${textoFalta}${disciplinasTexto}`);
                }
            }
        }

        // 2. Disciplinas perdidas por saídas
        const saídasDoAluno = registrosDeSaida
            .filter(registro => registro.alunoNome === aluno.nome && registro.sala === turma)
            .sort((a, b) => new Date(a.dataSaida).getTime() - new Date(b.dataSaida).getTime());

        for (const saída of saídasDoAluno) {
            const diaDaSemana = obterDiaDaSemanaParaCSV(saída.dataSaida);
            if (diaDaSemana === 'saturday' || diaDaSemana === 'sunday') continue;

            const horarioSaidaEmMinutos = converterHoraParaMinutos(saída.horarioSaida);
            const aulasPerdidas = await carregarAulasDoDia(diaDaSemana, turma);
            const aulasFiltradas = aulasPerdidas
                .filter(aula => {
                    const inicioAulaEmMinutos = converterHoraParaMinutos(aula.time_start);
                    return !disciplinasExcluidas.includes(aula.subject) && inicioAulaEmMinutos >= horarioSaidaEmMinutos;
                });

            if (aulasFiltradas.length > 0) {
                const dataFormatada = converterDataParaFormato(saída.dataSaida);
                const textoSaída = `${dataFormatada} (Saída às ${saída.horarioSaida}): `;
                const disciplinasTexto = aulasFiltradas.map(aula => {
                    const professor = disciplinasSemProfessor.includes(aula.subject) ? '' : aula.teacher;
                    return `${aula.subject} / ${professor}`;
                }).filter(texto => {
                    // Garante que disciplinas excluídas não apareçam no texto final
                    return !disciplinasExcluidas.some(excluida => texto.toUpperCase().startsWith(excluida + ' /'));
                }).join(', ');

                if (disciplinasTexto) {
                    disciplinasAfetadas.push(`${textoSaída}${disciplinasTexto}`);
                }
            }
        }

        return disciplinasAfetadas;
    }

    // Função para carregar as aulas de um dia específico para uma turma
    async function carregarAulasDoDia(diaDaSemana, turma) {
        const nomeArquivoCSV = `/data/${diaDaSemana}.csv`;

        try {
            const response = await fetch(nomeArquivoCSV);
            if (!response.ok) {
                console.error(`Erro ao carregar o arquivo de horário: ${nomeArquivoCSV}`);
                return [];
            }
            const csv = await response.text();

            return new Promise((resolve, reject) => {
                Papa.parse(csv, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: header => header.trim().replace(/^"|"$/g, ""),
                    transform: value => value.trim().replace(/^"|"$/g, ""),
                    complete: results => {
                        const aulasDoDia = results.data.filter(row => row.class === turma);
                        resolve(aulasDoDia);
                    },
                    error: (error) => {
                        console.error("Erro ao fazer o parse do CSV:", error);
                        reject([]);
                    }
                });
            });
        } catch (error) {
            console.error("Erro ao buscar o arquivo CSV:", error);
            return [];
        }
    }

    // Função para determinar o dia da semana a partir de uma data ISO
    function obterDiaDaSemanaParaCSV(dataISO) {
        const partes = dataISO.split('-');
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);
        const dataObj = new Date(ano, mes, dia);
        const dias = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dias[dataObj.getDay()];
    }

    // Função para converter data ISO (YYYY-MM-DD) para DD/MM/YYYY
    function converterDataParaFormato(dataISO) {
        const partes = dataISO.split('-');
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);
        const data = new Date(ano, mes, dia);
        const diaFormatado = String(data.getDate()).padStart(2, '0');
        const mesFormatado = String(data.getMonth() + 1).padStart(2, '0');
        const anoFormatado = data.getFullYear();
        return `${diaFormatado}/${mesFormatado}/${anoFormatado}`;
    }

    // Função para converter hora (HH:MM) para minutos
    function converterHoraParaMinutos(hora) {
        if (!hora) return null;
        const partes = hora.split(':');
        return parseInt(partes[0]) * 60 + parseInt(partes[1]);
    }

    // Função para expandir/colapsar o relatório de cada aluno
    window.toggleRelatorioAluno = function(turma, index) {
        const row = document.querySelector(`.aluno-${turma}-${index}`).closest('.aluno-row');
        const relatorioDiv = document.querySelector(`.aluno-${turma}-${index}`);
        if (relatorioDiv) {
            relatorioDiv.style.display = relatorioDiv.style.display === 'none' ? 'block' : 'none';
            row.classList.toggle('relatorio-aberto');
        }
    };
});