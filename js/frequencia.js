document.addEventListener('DOMContentLoaded', () => {
    // Verificação de login
    if (!localStorage.getItem('userRole')) {
        window.location.href = '../index.html';
        return;
    }

    // Constantes
    const turmas = [
        '6º ANO TURMA A', '6º ANO TURMA B', '7º ANO TURMA A', '7º ANO TURMA B',
        '8º ANO TURMA A', '8º ANO TURMA B', '8º ANO TURMA C', '9º ANO TURMA A', '9º ANO TURMA B',
        '1º SERIE -A', '1º SERIE -B', '2º ADM', '2º SERIE -B LGH',
        '3º SERIE  A CNT', '3º SERIE  B LGH', '3º VENDAS'
    ];

    // Elementos DOM
    const elementos = {
        turmasContainer: document.getElementById('turmasContainer'),
        alunosList: document.getElementById('alunosList'),
        relatorioContent: document.getElementById('relatorioContent'),
        calendarContainer: document.getElementById('calendarContainer'),
        monthYearHeader: document.getElementById('monthYear'),
        prevMonthBtn: document.getElementById('prevMonth'),
        nextMonthBtn: document.getElementById('nextMonth')
    };

    // Estado
    let estado = {
        alunos: JSON.parse(localStorage.getItem('frequencia')) || {},
        currentDate: new Date(),
        selectedDate: new Date().toISOString().split('T')[0]
    };

    // Inicialização
    init();

    function init() {
        elementos.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        elementos.nextMonthBtn.addEventListener('click', () => changeMonth(1));

        loadTurmas();
        generateCalendar();
        updateInterface();
    }

    // ================= CALENDÁRIO COMPACTO =================
    function generateCalendar() {
        const year = estado.currentDate.getFullYear();
        const month = estado.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        elementos.monthYearHeader.textContent =
            `${firstDay.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`.toUpperCase();

        let calendarHTML = '';

        // Dias da semana abreviados
        ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach((dia, index) => {
            const isWeekend = index === 0 || index === 6;
            calendarHTML += `<div class="calendar-weekday ${isWeekend ? 'weekend' : ''}">${dia}</div>`;
        });

        // Dias vazios
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += `<div class="calendar-day empty"></div>`;
        }

        // Dias do mês
        for (let dia = 1; dia <= lastDay.getDate(); dia++) {
            const dayStr = String(dia).padStart(2, '0');
            const monthStr = String(month + 1).padStart(2, '0');
            const dataStr = `${year}-${monthStr}-${dayStr}`;
            const currentDate = new Date(year, month, dia);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const hasData = Object.values(estado.alunos).some(turma =>
                turma.some(aluno => aluno.presencas[dataStr] !== undefined)
            );

            const classes = [
                'calendar-day',
                hasData ? 'has-data' : '',
                dataStr === estado.selectedDate ? 'selected' : '',
                isWeekend ? 'weekend' : ''
            ].filter(Boolean).join(' ');

            calendarHTML += `
                <div class="${classes}" data-date="${dataStr}">
                    ${dia}
                </div>`;
        }

        elementos.calendarContainer.innerHTML = calendarHTML;
        addCalendarDayListeners();
    }

    function addCalendarDayListeners() {
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', () => {
                estado.selectedDate = day.dataset.date;
                console.log("Data clicada (listener):", estado.selectedDate); // Debug
                generateCalendar();
                updateInterface();
            });
        });
    }

    function changeMonth(delta) {
        estado.currentDate.setMonth(estado.currentDate.getMonth() + delta);
        generateCalendar();
        updateInterface();
    }

    // ================= TURMAS =================
    function loadTurmas() {
        elementos.turmasContainer.innerHTML = `
            <select id="turmaSelect" class="turma-select">
                <option value="">Selecione uma turma</option>
                ${turmas.map(turma => `
                    <option value="${turma}">${turma}</option>
                `).join('')}
            </select>
        `;

        document.getElementById('turmaSelect').addEventListener('change', (e) => {
            selectTurma(e.target.value);
        });
    }

    function selectTurma(turma) {
        if (!turma) return;
        loadAlunos(turma);
        updateRelatorio();
    }

    // ================= ALUNOS =================
    function loadAlunos(turma) {
        if (!estado.alunos[turma]) estado.alunos[turma] = [];

        // Ordena os alunos alfabeticamente
        estado.alunos[turma].sort((a, b) => a.nome.localeCompare(b.nome));

        elementos.alunosList.innerHTML = estado.alunos[turma].map((aluno, index) => `
            <div class="freq-aluno-item">
                <div class="freq-aluno-info">
                    <div class="expand-indicator" onclick="toggleRelatorioAluno('${turma}', ${index})"></div>
                    <span class="freq-aluno-nome" onclick="toggleRelatorioAluno('${turma}', ${index})">${aluno.nome}</span>
                    <span class="freq-percentual">${calcPercentual(aluno)}%</span>
                </div>
                <div class="freq-status">
                    <button class="freq-btn-presente ${getStatusClass(aluno, 'presente')}"
                            onclick="marcarPresenca('${turma}', ${index}, 'presente')">
                        ✅
                    </button>
                    <button class="freq-btn-falta ${getStatusClass(aluno, 'falta')}"
                            onclick="marcarPresenca('${turma}', ${index}, 'falta')">
                        ❌
                    </button>
                    <button class="freq-btn-atestado ${getStatusClass(aluno, 'atestado')}"
                            onclick="marcarPresenca('${turma}', ${index}, 'atestado')">
                        📄
                    </button>
                    <button class="freq-btn-remover"
                            onclick="removerAluno('${turma}', ${index})">
                        🗑️
                    </button>
                </div>
                <div class="relatorio-individual aluno-${turma.replace(/\s+/g, '-')}-${index}" style="display: none;">
                    </div>
            </div>
        `).join('') + `
        <div class="freq-aluno-item novo-aluno">
            <input type="text" id="novoAlunoInput" placeholder="Novo aluno">
            <button class="freq-btn-add" onclick="adicionarAluno('${turma}')">
                ➕ Adicionar
            </button>
        </div>
    `;
        // Após carregar os alunos, gera os relatórios individuais (inicialmente escondidos)
        gerarRelatoriosIndividuais(turma);
    }

   // ================= OPERAÇÕES =================
   window.adicionarAluno = function(turma) {
    const input = document.getElementById('novoAlunoInput');
    const nome = input.value.trim();

    if (!nome || estado.alunos[turma].some(a => a.nome.toLowerCase() === nome.toLowerCase())) {
        alert('Nome inválido ou aluno já existe!');
        return;
    }

    estado.alunos[turma].push({
        nome,
        presencas: {}
    });

    saveAndUpdate(turma);
    input.value = '';
};

window.marcarPresenca = function(turma, index, status) {
    const data = estado.selectedDate;
    console.log("Data ao marcar presença:", data); // Debug

    // Remove status anterior se clicar no mesmo
    if (estado.alunos[turma][index].presencas[data] === status) {
        delete estado.alunos[turma][index].presencas[data];
    } else {
        estado.alunos[turma][index].presencas[data] = status;
    }

    saveAndUpdate(turma);
};

window.removerAluno = function(turma, index) {
    if (confirm(`Deseja remover o aluno "${estado.alunos[turma][index].nome}"?`)) {
        estado.alunos[turma].splice(index, 1);
        saveAndUpdate(turma);
    }
};

function saveAndUpdate(turma) {
    localStorage.setItem('frequencia', JSON.stringify(estado.alunos));
    loadAlunos(turma);
    generateCalendar();
    updateRelatorio();
}

window.toggleRelatorioAluno = function(turma, index) {
    const relatorioDiv = document.querySelector(`.aluno-${turma.replace(/\s+/g, '-')}-${index}`);
    const alunoItem = relatorioDiv.closest('.freq-aluno-item');
    if (relatorioDiv) {
        relatorioDiv.style.display = relatorioDiv.style.display === 'none' ? 'block' : 'none';
        alunoItem.classList.toggle('relatorio-aberto');
    } else {
        gerarRelatorioIndividual(turma, index);
    }
};

function gerarRelatorioIndividual(turma, index) {
    const aluno = estado.alunos[turma][index];
    const relatorioDiv = document.querySelector(`.aluno-${turma.replace(/\s+/g, '-')}-${index}`);

    if (!aluno || !relatorioDiv) return;

    const presencasOrdenadas = Object.entries(aluno.presencas).sort((a, b) => {
        // Ordena pela chave (a[0] e b[0]), que são as strings de data
        return a[0].localeCompare(b[0]);
    });

    // Agrupar presenças por mês
    const presencasPorMes = {};
    presencasOrdenadas.forEach(([data, status]) => {
        const [year, month] = data.split('-');
        const monthYear = `${year}-${month}`;
        if (!presencasPorMes[monthYear]) {
            presencasPorMes[monthYear] = [];
        }
        presencasPorMes[monthYear].push([data, status]);
    });

    // Obter os meses em ordem cronológica
    const mesesOrdenados = Object.keys(presencasPorMes).sort();

    let relatorioHTML = `
        <div class="relatorio-individual-header">
            <h4>Frequência de ${aluno.nome}</h4>
        </div>
        <div class="relatorio-individual-meses">
    `;

    mesesOrdenados.forEach(monthYear => {
        const [year, month] = monthYear.split('-');
        const dataReferencia = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const nomeMes = dataReferencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

        relatorioHTML += `
            <div class="relatorio-mes">
                <h5>${nomeMes}</h5>
                <div class="relatorio-individual-dias">
        `;

        presencasPorMes[monthYear].forEach(([data, status]) => {
            const dateParts = data.split('-');
            const day = parseInt(dateParts[2], 10);
            const localDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, day, 12, 0, 0);

            relatorioHTML += `
                <div class="dia ${status === 'presente' ? 'presente' : (status === 'falta' ? 'falta' : 'atestado')}">
                    <span>${localDate.toLocaleDateString('pt-BR', { day: '2-digit' })}</span>
                    <span>${status === 'presente' ? '✅' : (status === 'falta' ? '❌' : '📄')}</span>
                </div>
            `;
        });

        relatorioHTML += `
                </div>
            </div>
        `;
    });

    relatorioHTML += `
        </div>
    `;

    relatorioDiv.innerHTML = relatorioHTML;
}

function gerarRelatoriosIndividuais(turma) {
    const alunosDaTurma = estado.alunos[turma];
    if (alunosDaTurma) {
        alunosDaTurma.forEach((aluno, index) => {
            gerarRelatorioIndividual(turma, index);
        });
    }
}

    // ================= RELATÓRIO DA TURMA ATUAL =================
    function updateRelatorio() {
        const turma = document.getElementById('turmaSelect').value;
        if (!turma || !estado.alunos[turma]) {
            elementos.relatorioContent.innerHTML = '<div class="sem-turma">Selecione uma turma para ver o relatório</div>';
            return;
        }

        // Ordena os alunos alfabeticamente para o relatório também
        const alunosOrdenadosRelatorio = [...estado.alunos[turma]].sort((a, b) => a.nome.localeCompare(b.nome));

        elementos.relatorioContent.innerHTML = `
            <div class="relatorio-header">
                <h3>📊 Relatório da Turma: ${turma}</h3>
                <button class="btn-exportar" onclick="exportarPlanilha()">
                    📤 Exportar
                </button>
            </div>
            <div class="dias-registrados">
                ${alunosOrdenadosRelatorio.map(aluno => {
                    const totalFaltas = Object.values(aluno.presencas).filter(status => status === 'falta').length;
                    const situacao = totalFaltas < 5 ? '✅' : '⚠️ Faltas Excedidas';
                    const situacaoCor = totalFaltas < 5 ? 'situacao-normal' : 'situacao-alerta';

                    return `
                        <div class="relatorio-aluno-resumo">
                            <span class="expand-indicator" onclick="toggleRelatorioAluno('${turma}', ${alunosOrdenadosRelatorio.indexOf(aluno)})"></span>
                            <span class="aluno-nome-resumo" onclick="toggleRelatorioAluno('${turma}', ${alunosOrdenadosRelatorio.indexOf(aluno)})">${aluno.nome}</span>
                            <span class="percentual-resumo">${calcPercentual(aluno)}%</span>
                            <span class="${situacaoCor}">${situacao}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ================= EXPORTAÇÃO =================
    window.exportarPlanilha = function() {
        const turma = document.getElementById('turmaSelect').value;
        if (!turma || !estado.alunos[turma]) return alert('Selecione uma turma!');

        // Ordena os alunos alfabeticamente para a exportação também
        const alunosOrdenadosExportacao = [...estado.alunos[turma]].sort((a, b) => a.nome.localeCompare(b.nome));
        const datasUnicas = [...new Set(alunosOrdenadosExportacao.flatMap(a => Object.keys(a.presencas)))].sort();

        let csvContent = "Nome;" + datasUnicas.join(';') + "\n";

        alunosOrdenadosExportacao.forEach(aluno => {
            let linha = `"${aluno.nome}";`;
            linha += datasUnicas.map(data => {
                return aluno.presencas[data] !== undefined
                    ? (aluno.presencas[data] === 'presente' ? 'Presente' : (aluno.presencas[data] === 'falta' ? 'Falta' : 'Atestado'))
                    : 'Não Registrado';
            }).join(';');
            csvContent += linha + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `frequencia_${turma}.csv`);
        link.click();
        URL.revokeObjectURL(url);
    };

    // ================= UTILITÁRIOS =================
    function calcPercentual(aluno) {
        const registros = Object.values(aluno.presencas);
        if (registros.length === 0) return 0;

        const diasValidos = registros.filter(p => p !== 'atestado');
        const presentes = diasValidos.filter(p => p === 'presente').length;

        return diasValidos.length > 0
            ? ((presentes / diasValidos.length) * 100).toFixed(1)
            : 0;
    }

    function getStatusClass(aluno, status) {
        return aluno.presencas[estado.selectedDate] === status ? 'active' : '';
    }

    function updateInterface() {
        const turma = document.getElementById('turmaSelect').value;
        if (turma) loadAlunos(turma);
        updateRelatorio();
    }
});