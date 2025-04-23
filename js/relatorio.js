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
    const disciplinasExcluidas = ['ALMOÇO', 'CAFÉ', 'LANCHE', 'CAFÉ DA MANHÃ'];
    const disciplinasSemProfessor = ['ELETIVA', 'CLUBE'];
    const diasDaSemana = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    // Configuração do período (mês de abril de 2025)
    const MES_ANALISADO = '2025-04'; // Período fixo para abril de 2025
    const SEMANAS_NO_MES = 4; // Assumindo 4 semanas completas (segunda a sexta)

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
            const { faltas, saidas } = await obterDisciplinasAfetadas(aluno, turma);
            const frequenciaPorDisciplina = await calcularFrequenciaPorDisciplina(aluno, turma);

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
                            <h4 style="display: block; width: 100%;">Faltas:</h4>
                            <div class="disciplinas-sublista">
                                ${faltas.length > 0 ?
                                    faltas.map(item => `<div style="margin-bottom: 0.5rem;">${item}</div>`).join('') :
                                    '<div style="margin-bottom: 0.5rem;">Nenhuma falta registrada</div>'}
                            </div>
                            <h4 style="display: block; width: 100%; margin-top: 1rem;">Saídas Antecipadas:</h4>
                            <div class="disciplinas-sublista">
                                ${saidas.length > 0 ?
                                    saidas.map(item => `<div style="margin-bottom: 0.5rem;">${item}</div>`).join('') :
                                    '<div style="margin-bottom: 0.5rem;">Nenhuma saída registrada</div>'}
                            </div>
                        </div>
                        <div class="frequencia-por-disciplina" style="margin-top: 1rem;">
                            <h4>Frequência por Disciplina (Mês de Abril):</h4>
                            <div class="disciplinas-lista">
                                ${frequenciaPorDisciplina.length > 0 ?
                                    frequenciaPorDisciplina.map(item => `<span class="disciplina ${item.porcentagem < 50 ? 'warning' : ''}">${item.disciplina}: ${item.porcentagem}% (${item.aulasPerdidas}/${item.totalAulas})</span>`).join('') :
                                    '<span>Nenhuma frequência registrada</span>'}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="${frequenciaPercentual < 75 ? 'warning' : ''}">${frequenciaPercentual}%</td>
                <td>${numeroSaidas}</td>
            `;
            tabelaRelatorio.appendChild(row);
        }
    }

    // Função para calcular o percentual de frequência geral (reaproveitada do frequencia.js)
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

    // Função para calcular a frequência por disciplina
    async function calcularFrequenciaPorDisciplina(aluno, turma) {
        // 1. Contar o total de aulas por disciplina em uma semana típica
        const totalAulasPorDisciplinaSemanal = {};
        for (const dia of diasDaSemana) {
            const aulasDoDia = await carregarAulasDoDia(dia, turma);
            aulasDoDia.forEach(aula => {
                if (!disciplinasExcluidas.includes(aula.subject)) {
                    totalAulasPorDisciplinaSemanal[aula.subject] = (totalAulasPorDisciplinaSemanal[aula.subject] || 0) + 1;
                }
            });
        }

        // Multiplicar o total semanal pelo número de semanas no mês
        const totalAulasPorDisciplina = {};
        for (const [disciplina, totalSemanal] of Object.entries(totalAulasPorDisciplinaSemanal)) {
            if (!disciplinasExcluidas.includes(disciplina)) {
                totalAulasPorDisciplina[disciplina] = totalSemanal * SEMANAS_NO_MES;
            }
        }

        // 2. Contar as aulas perdidas por disciplina (faltas e saídas), apenas no mês analisado
        const aulasPerdidasPorDisciplina = {};
        const diasDeFalta = Object.entries(aluno.presencas)
            .filter(([data, status]) => status === 'falta' && data.startsWith(MES_ANALISADO))
            .map(([data, _]) => data)
            .sort();

        const saídasDoAluno = registrosDeSaida
            .filter(registro => 
                registro.alunoNome === aluno.nome && 
                registro.sala === turma && 
                registro.dataSaida.startsWith(MES_ANALISADO)
            )
            .sort((a, b) => new Date(a.dataSaida).getTime() - new Date(b.dataSaida).getTime());

        // Criar um conjunto de dias com aulas já contadas como perdidas
        const diasContados = new Set();

        // Faltas (prioridade sobre saídas)
        for (const data of diasDeFalta) {
            const diaDaSemana = obterDiaDaSemanaParaCSV(data);
            if (diaDaSemana === 'saturday' || diaDaSemana === 'sunday') continue;

            diasContados.add(data); // Marcar o dia como contado

            const aulasDoDia = await carregarAulasDoDia(diaDaSemana, turma);
            const aulasFiltradas = aulasDoDia.filter(aula => !disciplinasExcluidas.includes(aula.subject));
            aulasFiltradas.forEach(aula => {
                aulasPerdidasPorDisciplina[aula.subject] = (aulasPerdidasPorDisciplina[aula.subject] || 0) + 1;
            });
        }

        // Saídas (apenas para dias que não foram contados como falta)
        for (const saída of saídasDoAluno) {
            const data = saída.dataSaida;
            if (diasContados.has(data)) continue; // Pular dias que já foram contados como falta

            const diaDaSemana = obterDiaDaSemanaParaCSV(data);
            if (diaDaSemana === 'saturday' || diaDaSemana === 'sunday') continue;

            const horarioSaidaEmMinutos = converterHoraParaMinutos(saída.horarioSaida);
            const aulasPerdidas = await carregarAulasDoDia(diaDaSemana, turma);
            const aulasFiltradas = aulasPerdidas
                .filter(aula => {
                    const inicioAulaEmMinutos = converterHoraParaMinutos(aula.time_start);
                    return !disciplinasExcluidas.includes(aula.subject) && inicioAulaEmMinutos >= horarioSaidaEmMinutos;
                });

            aulasFiltradas.forEach(aula => {
                aulasPerdidasPorDisciplina[aula.subject] = (aulasPerdidasPorDisciplina[aula.subject] || 0) + 1;
            });
        }

        // 3. Calcular a frequência por disciplina, excluindo disciplinas indesejadas
        const frequenciaPorDisciplina = [];
        for (const [disciplina, totalAulas] of Object.entries(totalAulasPorDisciplina)) {
            if (disciplinasExcluidas.includes(disciplina)) continue; // Pular disciplinas excluídas
            const aulasPerdidas = Math.min(aulasPerdidasPorDisciplina[disciplina] || 0, totalAulas); // Garantir que não exceda o total
            const aulasPresentes = totalAulas - aulasPerdidas;
            const porcentagem = totalAulas > 0 ? ((aulasPresentes / totalAulas) * 100).toFixed(1) : 0;
            frequenciaPorDisciplina.push({
                disciplina,
                porcentagem,
                aulasPerdidas,
                totalAulas
            });
        }

        // Ordenar por porcentagem (menor para maior) para destacar as disciplinas mais críticas
        return frequenciaPorDisciplina.sort((a, b) => a.porcentagem - b.porcentagem);
    }

    // Função para obter as disciplinas afetadas por faltas e saídas, separando em duas listas
    async function obterDisciplinasAfetadas(aluno, turma) {
        const faltas = [];
        const saidas = [];

        // 1. Disciplinas perdidas por faltas
        const diasDeFalta = Object.entries(aluno.presencas)
            .filter(([data, status]) => status === 'falta' && data.startsWith(MES_ANALISADO))
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
                    return !disciplinasExcluidas.some(excluida => texto.toUpperCase().startsWith(excluida + ' /'));
                }).join(', ');

                if (disciplinasTexto) {
                    faltas.push(`${textoFalta}${disciplinasTexto}`);
                }
            }
        }

        // 2. Disciplinas perdidas por saídas
        const saídasDoAluno = registrosDeSaida
            .filter(registro => 
                registro.alunoNome === aluno.nome && 
                registro.sala === turma && 
                registro.dataSaida.startsWith(MES_ANALISADO)
            )
            .sort((a, b) => new Date(a.dataSaida).getTime() - new Date(b.dataSaida).getTime());

        for (const saída of saídasDoAluno) {
            const data = saída.dataSaida;
            const diaDaSemana = obterDiaDaSemanaParaCSV(data);
            if (diaDaSemana === 'saturday' || diaDaSemana === 'sunday') continue;

            const horarioSaidaEmMinutos = converterHoraParaMinutos(saída.horarioSaida);
            const aulasDoDia = await carregarAulasDoDia(diaDaSemana, turma);

            // Log para depuração
            console.log(`Saída de ${aluno.nome} em ${data} às ${saída.horarioSaida} (${horarioSaidaEmMinutos} minutos)`);
            console.log(`Aulas do dia (${diaDaSemana}):`, aulasDoDia);

            const aulasFiltradas = aulasDoDia.filter(aula => {
                const inicioAulaEmMinutos = converterHoraParaMinutos(aula.time_start);
                const fimAulaEmMinutos = converterHoraParaMinutos(aula.time_end);

                // Considerar aula perdida se o horário de saída for menor ou igual ao horário de término da aula
                const aulaPerdida = !disciplinasExcluidas.includes(aula.subject) &&
                    horarioSaidaEmMinutos <= fimAulaEmMinutos;

                console.log(`Aula: ${aula.subject}, Início: ${aula.time_start} (${inicioAulaEmMinutos}), Fim: ${aula.time_end} (${fimAulaEmMinutos}), Perdida: ${aulaPerdida}`);
                return aulaPerdida;
            });

            if (aulasFiltradas.length > 0) {
                const dataFormatada = converterDataParaFormato(data);
                const textoSaída = `${dataFormatada} (Saída às ${saída.horarioSaida}): `;
                const disciplinasTexto = aulasFiltradas.map(aula => {
                    const professor = disciplinasSemProfessor.includes(aula.subject) ? '' : aula.teacher;
                    return `${aula.subject} / ${professor}`;
                }).filter(texto => {
                    return !disciplinasExcluidas.some(excluida => texto.toUpperCase().startsWith(excluida + ' /'));
                }).join(', ');

                if (disciplinasTexto) {
                    saidas.push(`${textoSaída}${disciplinasTexto}`);
                } else {
                    console.log(`Nenhuma disciplina válida encontrada para a saída em ${dataFormatada}`);
                }
            } else {
                console.log(`Nenhuma aula perdida encontrada para a saída em ${converterDataParaFormato(data)}`);
            }
        }

        return { faltas, saidas };
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
                        // Normalizar "ª" para "º" no nome da turma
                        const turmaNormalizada = turma.replace('ª', 'º').trim().toUpperCase();
                        const aulasDoDia = results.data.filter(row => {
                            const turmaCSV = row.class.replace('ª', 'º').trim().toUpperCase();
                            return turmaCSV === turmaNormalizada;
                        });
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
        if (!hora) return 0; // Retornar 0 se a hora for inválida
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