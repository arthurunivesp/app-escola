document.addEventListener('DOMContentLoaded', () => {
    const inputBuscaAluno = document.querySelector('.saida-input');
    const btnNovoRegistro = document.querySelector('.saida-btn-registro');
    const listaSaidasContainer = document.getElementById('lista-saidas');
    let listaAlunosPorTurma = {};
    let registroEditandoTimestamp = null; // Variável para rastrear o registro sendo editado

    const disciplinasExcluidas = ['ALMOÇO', 'CAFÉ', 'LANCHE', 'CAFÉ DA MANHÃ']; // Lista de disciplinas a excluir

    async function buscarSeriesUnicas() {
        const diasDaSemana = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const series = new Set();

        for (const dia of diasDaSemana) {
            const nomeArquivoCSV = `/data/${dia}.csv`;
            try {
                const response = await fetch(nomeArquivoCSV);
                if (response.ok) {
                    const csv = await response.text();
                    const results = await new Promise((resolve, reject) => {
                        Papa.parse(csv, {
                            header: true,
                            skipEmptyLines: true,
                            transformHeader: header => header.trim().replace(/^"|"$/g, ""),
                            transform: value => value.trim().replace(/^"|"$/g, ""),
                            complete: results => resolve(results),
                            error: (error) => reject(error)
                        });
                    });
                    if (results && results.data) {
                        results.data.forEach(row => {
                            if (row.class) {
                                series.add(row.class.trim());
                            }
                        });
                    }
                } else {
                    console.error(`Erro ao carregar o arquivo de horário: ${nomeArquivoCSV}`);
                }
            } catch (error) {
                console.error("Erro ao processar o arquivo CSV:", error);
            }
        }
        return Array.from(series).sort();
    }

    async function carregarListaAlunos() {
        const frequenciaData = JSON.parse(localStorage.getItem('frequencia'));
        if (frequenciaData) {
            listaAlunosPorTurma = frequenciaData;
            console.log('Dados de frequência carregados:', listaAlunosPorTurma);
        } else {
            console.log('Nenhum dado de frequência encontrado no localStorage.');
            listaAlunosPorTurma = {};
        }
    }

    inputBuscaAluno.addEventListener('input', function() {
        const termoBusca = this.value.toLowerCase();
        let resultadosBusca = [];
        for (const turma in listaAlunosPorTurma) {
            const alunosFiltrados = listaAlunosPorTurma[turma].filter(aluno =>
                aluno.nome.toLowerCase().includes(termoBusca)
            );
            resultadosBusca = resultadosBusca.concat(alunosFiltrados.map(aluno => ({ ...aluno, turma })));
        }
        console.log('Resultados da busca:', resultadosBusca);
        // Aqui você pode adicionar lógica para exibir sugestões na interface
    });

    btnNovoRegistro.addEventListener('click', () => {
        console.log('Abrir modal para novo registro');
        abrirModalNovoRegistro();
    });

    async function abrirModalNovoRegistro() {
        const seriesUnicas = await buscarSeriesUnicas();

        const modal = document.createElement('div');
        modal.classList.add('modal-registro');
        modal.innerHTML = `
            <h3>Novo Registro de Saída</h3>
            <label for="serie">Série:</label>
            <select id="serie">
                <option value="">Selecione a Série</option>
                ${seriesUnicas.map(serie => `<option value="${serie}">${serie}</option>`).join('')}
            </select>
            <label for="aluno">Aluno:</label>
            <select id="aluno-lista" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 1rem; color: #2d3748; box-sizing: border-box;" disabled>
                <option value="">Selecione o Aluno</option>
            </select>
            <label for="data">Data da Saída:</label>
            <input type="date" id="data" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 1rem; color: #2d3748; box-sizing: border-box;">
            <label for="hora">Horário de Saída:</label>
            <input type="time" id="hora" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 1rem; color: #2d3748; box-sizing: border-box;">
            <label for="responsavel">Responsável:</label>
            <input type="text" id="responsavel" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 1rem; color: #2d3748; box-sizing: border-box;">
            <label for="transporte">Transporte:</label>
            <input type="text" id="transporte" placeholder="Se aplicável" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 1rem; color: #2d3748; box-sizing: border-box;">
            <button id="salvar-saida">Salvar Saída</button>
            <button id="cancelar-saida">Cancelar</button>
        `;
        document.body.appendChild(modal);

        const selectSerie = modal.querySelector('#serie');
        const selectAlunoLista = modal.querySelector('#aluno-lista');
        const btnSalvarSaida = modal.querySelector('#salvar-saida');
        const btnCancelarSaida = modal.querySelector('#cancelar-saida');
        const inputDataSaida = modal.querySelector('#data');
        const inputHoraSaida = modal.querySelector('#hora');
        const inputResponsavel = modal.querySelector('#responsavel');
        const inputTransporte = modal.querySelector('#transporte');

        selectSerie.addEventListener('change', () => {
            const serieSelecionada = selectSerie.value;
            if (serieSelecionada && listaAlunosPorTurma[serieSelecionada]) {
                selectAlunoLista.innerHTML = '<option value="">Selecione o Aluno</option>';
                listaAlunosPorTurma[serieSelecionada].sort((a, b) => a.nome.localeCompare(b.nome)).forEach(aluno => {
                    const option = document.createElement('option');
                    option.value = aluno.nome;
                    option.textContent = aluno.nome;
                    selectAlunoLista.appendChild(option);
                });
                selectAlunoLista.disabled = false;
            } else {
                selectAlunoLista.innerHTML = '<option value="">Selecione o Aluno</option>';
                selectAlunoLista.disabled = true;
            }
        });

        btnSalvarSaida.addEventListener('click', async () => {
            const alunoNome = selectAlunoLista.value;
            const serieSelecionada = selectSerie.value;
            const dataSaidaISO = inputDataSaida.value;
            const horarioSaida = inputHoraSaida.value;
            const responsavel = inputResponsavel.value;
            const transporte = inputTransporte.value;

            if (alunoNome && serieSelecionada && dataSaidaISO && horarioSaida && responsavel) {
                const dataSaidaLocal = new Date(dataSaidaISO + 'T' + horarioSaida + ':00');
                const novoRegistro = {
                    alunoNome,
                    sala: serieSelecionada,
                    dataSaida: dataSaidaLocal.toISOString().split('T')[0],
                    horarioSaida,
                    responsavel,
                    transporte,
                    timestamp: registroEditandoTimestamp || Date.now() // Usa timestamp existente ou cria novo
                };
                if (registroEditandoTimestamp) {
                    await atualizarRegistroSaida(novoRegistro);
                } else {
                    await salvarRegistroSaida(novoRegistro);
                }
                document.body.removeChild(modal);
                const overlay = document.querySelector('.modal-overlay');
                if (overlay) document.body.removeChild(overlay);
                registroEditandoTimestamp = null; // Limpa o timestamp de edição
            } else {
                alert('Por favor, preencha todos os campos obrigatórios.');
            }
        });

        btnCancelarSaida.addEventListener('click', () => {
            document.body.removeChild(modal);
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) document.body.removeChild(overlay);
            registroEditandoTimestamp = null; // Limpa o timestamp de edição
        });

        const overlay = document.createElement('div');
        overlay.classList.add('modal-overlay');
        document.body.appendChild(overlay);

        // Se estiver editando, preenche os campos e desabilita a seleção de aluno/série
        if (registroEditandoTimestamp) {
            const registroParaEdicao = (JSON.parse(localStorage.getItem('registrosDeSaida')) || [])
                .find(registro => registro.timestamp === registroEditandoTimestamp);
            if (registroParaEdicao) {
                selectSerie.value = registroParaEdicao.sala;
                selectAlunoLista.value = registroParaEdicao.alunoNome;
                selectSerie.disabled = true;
                selectAlunoLista.disabled = true;
                inputDataSaida.value = registroParaEdicao.dataSaida;
                inputHoraSaida.value = registroParaEdicao.horarioSaida;
                inputResponsavel.value = registroParaEdicao.responsavel;
                inputTransporte.value = registroParaEdicao.transporte || '';
                modal.querySelector('h3').textContent = 'Editar Registro de Saída';
                modal.querySelector('#salvar-saida').textContent = 'Salvar Alterações';
            }
        }
    }

    async function salvarRegistroSaida(registro) {
        let registrosDeSaida = JSON.parse(localStorage.getItem('registrosDeSaida')) || [];
        registrosDeSaida.push(registro);
        localStorage.setItem('registrosDeSaida', JSON.stringify(registrosDeSaida));
        await carregarExibirRegistrosSaida();
    }

    async function atualizarRegistroSaida(registroAtualizado) {
        let registrosDeSaida = JSON.parse(localStorage.getItem('registrosDeSaida')) || [];
        const index = registrosDeSaida.findIndex(registro => registro.timestamp === registroAtualizado.timestamp);
        if (index !== -1) {
            registrosDeSaida[index] = registroAtualizado;
            localStorage.setItem('registrosDeSaida', JSON.stringify(registrosDeSaida));
            await carregarExibirRegistrosSaida();
        }
    }

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

    async function obterAulasPerdidas(alunoNome, salaDoAluno, dataSaidaISO, horarioSaida) {
        const diaDaSemanaCSV = obterDiaDaSemanaParaCSV(dataSaidaISO);
        const horarioSaidaEmMinutos = converterHoraParaMinutos(horarioSaida);
        const aulasPerdidas = [];

        console.log(`[DEBUG] Aluno: ${alunoNome}, Sala: ${salaDoAluno}, Data: ${dataSaidaISO}, Horário de Saída: ${horarioSaida} (${horarioSaidaEmMinutos} minutos), Dia: ${diaDaSemanaCSV}`);

        if (diaDaSemanaCSV === 'saturday' || diaDaSemanaCSV === 'sunday') {
            console.log(`[DEBUG] Dia da semana é ${diaDaSemanaCSV}, retornando vazio.`);
            return [];
        }

        if (salaDoAluno && diaDaSemanaCSV) {
            const nomeArquivoCSV = `/data/${diaDaSemanaCSV}.csv`;
            console.log(`[DEBUG] Tentando carregar arquivo: ${nomeArquivoCSV}`);

            try {
                const response = await fetch(nomeArquivoCSV);
                if (!response.ok) {
                    console.error(`[ERROR] Erro ao carregar o arquivo de horário: ${nomeArquivoCSV}, status: ${response.status}`);
                    return [];
                }
                const csv = await response.text();
                console.log(`[DEBUG] Arquivo ${nomeArquivoCSV} carregado com sucesso, conteúdo: ${csv.substring(0, 100)}...`);

                return new Promise((resolve, reject) => {
                    Papa.parse(csv, {
                        header: true,
                        skipEmptyLines: true,
                        transformHeader: header => header.trim().replace(/^"|"$/g, ""),
                        transform: value => value.trim().replace(/^"|"$/g, ""),
                        complete: results => {
                            if (!results.data || results.data.length === 0) {
                                console.error(`[ERROR] Nenhum dado encontrado no arquivo ${nomeArquivoCSV}.`);
                                resolve([]);
                                return;
                            }

                            // Normalizar "ª" para "º" no nome da turma
                            const aulasDoDia = results.data.filter(row => {
                                const turmaCSV = row.class.replace('ª', 'º').trim().toUpperCase();
                                const turmaEsperada = salaDoAluno.replace('ª', 'º').trim().toUpperCase();
                                return turmaCSV === turmaEsperada;
                            });

                            if (aulasDoDia.length === 0) {
                                console.error(`[ERROR] Nenhuma aula encontrada para a turma ${salaDoAluno} em ${nomeArquivoCSV}. Verifique o nome da turma no CSV.`);
                            }
                            console.log(`[DEBUG] Aulas encontradas para ${salaDoAluno}:`, aulasDoDia);

                            const aulasPerdidasFiltradas = aulasDoDia.filter(aula => {
                                const inicioAulaEmMinutos = converterHoraParaMinutos(aula.time_start);
                                const aulaPerdida = inicioAulaEmMinutos >= horarioSaidaEmMinutos &&
                                                    !disciplinasExcluidas.includes(aula.subject.toUpperCase());
                                console.log(`[DEBUG] Aula: ${aula.subject} (${aula.time_start}-${aula.time_end}), Início: ${inicioAulaEmMinutos} minutos, Perdida: ${aulaPerdida}`);
                                return aulaPerdida;
                            });

                            console.log(`[DEBUG] Aulas perdidas filtradas:`, aulasPerdidasFiltradas);
                            resolve(aulasPerdidasFiltradas.map(aula => `${aula.subject} (${aula.time_start}-${aula.time_end})`));
                        },
                        error: (error) => {
                            console.error("[ERROR] Erro ao fazer o parse do CSV:", error);
                            reject([]);
                        }
                    });
                });

            } catch (error) {
                console.error("[ERROR] Erro ao buscar o arquivo CSV:", error);
                return [];
            }
        }
        return aulasPerdidas;
    }

    function obterDiaDaSemanaParaCSV(dataISO) {
        const partes = dataISO.split('-');
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);
        const dataObj = new Date(ano, mes, dia);
        const dias = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dias[dataObj.getDay()];
    }

    function converterHoraParaMinutos(hora) {
        if (!hora) return 0;
        const partes = hora.split(':');
        // Suporta tanto "HH:MM" quanto "HH:MM:SS"
        return parseInt(partes[0]) * 60 + parseInt(partes[1]);
    }

    async function deletarRegistroSaida(timestamp) {
        let registrosDeSaida = JSON.parse(localStorage.getItem('registrosDeSaida')) || [];
        registrosDeSaida = registrosDeSaida.filter(registro => registro.timestamp !== timestamp);
        localStorage.setItem('registrosDeSaida', JSON.stringify(registrosDeSaida));
        await carregarExibirRegistrosSaida();
    }

    async function carregarExibirRegistrosSaida() {
        const registrosDeSaida = JSON.parse(localStorage.getItem('registrosDeSaida')) || [];
        const saidasPorSala = {};

        // Agrupar registros por sala
        registrosDeSaida.forEach(registro => {
            if (!saidasPorSala[registro.sala]) {
                saidasPorSala[registro.sala] = [];
            }
            saidasPorSala[registro.sala].push(registro);
        });

        // Limpar a interface
        listaSaidasContainer.innerHTML = '';

        // Iterar pelas salas que têm saídas
        for (const sala in saidasPorSala) {
            if (saidasPorSala.hasOwnProperty(sala)) {
                const registrosDaSala = saidasPorSala[sala].sort((a, b) => new Date(a.dataSaida).getTime() - new Date(b.dataSaida).getTime());

                // Criar cabeçalho da sala (acordeão)
                const salaHeader = document.createElement('div');
                salaHeader.classList.add('sala-accordion-header');
                salaHeader.innerHTML = `Sala: <span>${sala}</span> (${registrosDaSala.length} saídas)`;
                salaHeader.dataset.sala = sala;
                listaSaidasContainer.appendChild(salaHeader);

                // Criar container para os registros da sala (inicialmente escondido)
                const salaRegistrosContainer = document.createElement('div');
                salaRegistrosContainer.classList.add('sala-registros-container');
                salaRegistrosContainer.dataset.sala = sala;

                for (const registro of registrosDaSala) {
                    const aulasPerdidas = await obterAulasPerdidas(registro.alunoNome, registro.sala, registro.dataSaida, registro.horarioSaida);
                    const novoCard = document.createElement('div');
                    novoCard.classList.add('saida-card');
                    novoCard.innerHTML = `
                        <div class="saida-info">
                            <div><label class="saida-label">Aluno:</label><p>${registro.alunoNome}</p></div>
                            <div><label class="saida-label">Horário de Saída:</label><p>${registro.horarioSaida} - ${converterDataParaFormato(registro.dataSaida)}</p></div>
                            <div><label class="saida-label">Responsável:</label><p>${registro.responsavel}</p></div>
                            ${registro.transporte ? `<div><label class="saida-label">Transporte:</label><p>${registro.transporte}</p></div>` : ''}
                        </div>
                        <div class="saida-historico">
                            <h4>Aulas Perdidas:</h4>
                            ${aulasPerdidas && aulasPerdidas.length > 0 ? aulasPerdidas.map(aula => `<span class="saida-aula-perdida">${aula}</span>`).join('') : '<span class="saida-aula-perdida">Nenhuma aula perdida</span>'}
                        </div>
                        <div class="saida-acoes">
                            <button class="btn-deletar" data-timestamp="${registro.timestamp}">🗑️ Deletar</button>
                            <button class="btn-editar" data-timestamp="${registro.timestamp}" data-sala="${registro.sala}">✏️ Editar</button>
                        </div>
                    `;
                    salaRegistrosContainer.appendChild(novoCard);
                }
                listaSaidasContainer.appendChild(salaRegistrosContainer);
            }
        }

        // Adicionar lógica para o efeito sanfona
        document.querySelectorAll('.sala-accordion-header').forEach(header => {
            header.addEventListener('click', function() {
                const sala = this.dataset.sala;
                const registrosContainer = document.querySelector(`.sala-registros-container[data-sala="${sala}"]`);
                if (registrosContainer) {
                    registrosContainer.classList.toggle('open');
                }
            });
        });

        // Adiciona os event listeners para os botões
        document.querySelectorAll('.btn-deletar').forEach(button => {
            button.addEventListener('click', function() {
                const timestamp = parseFloat(this.dataset.timestamp);
                deletarRegistroSaida(timestamp);
            });
        });

        document.querySelectorAll('.btn-editar').forEach(button => {
            button.addEventListener('click', function() {
                const timestamp = parseFloat(this.dataset.timestamp);
                const registroParaEditar = registrosDeSaida.find(registro => registro.timestamp === timestamp);
                if (registroParaEditar) {
                    registroEditandoTimestamp = timestamp;
                    abrirModalNovoRegistro();
                }
            });
        });
    }

    // Inicialização
    carregarListaAlunos();
    carregarExibirRegistrosSaida();
});