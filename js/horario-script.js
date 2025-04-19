const { useState, useEffect } = React;

const App = () => {
  // Estados gerais
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Tipos de busca:
  // 'class'   → Por Turma e Intervalo
  // 'teacher' → Por Professor (dia e nome, sem horário)
  // 'current' → Aula Atual na Turma (usa horário local)
  const [searchType, setSearchType] = useState('class');

  // Campos de busca
  const [timeInput, setTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [teacherInput, setTeacherInput] = useState('');
  const [selectedDay, setSelectedDay] = useState('tuesday');

  const days = [
    { value: 'monday', label: 'Segunda-feira' },
    { value: 'tuesday', label: 'Terça-feira' },
    { value: 'wednesday', label: 'Quarta-feira' },
    { value: 'thursday', label: 'Quinta-feira' },
    { value: 'friday', label: 'Sexta-feira' }
  ];

  const classes = [
    '6º ANO TURMA A', '6º ANO TURMA B', '7º ANO TURMA A', '7º ANO TURMA B',
    '8º ANO TURMA A', '8º ANO TURMA B', '8º ANO TURMA C', '9º ANO TURMA A', '9º ANO TURMA B',
    '1º SERIE -A', '1º SERIE -B', '2º ADM', '2º SERIE -B LGH', '3º SERIE A CNT',
    '3º SERIE B LGH', '3º SERIE VENDAS'
  ];

  // Converte uma string de horário de "HH:MM" ou "15H50" em minutos totais
  const parseTimeString = (input) => {
    if (!input) return null;
    const normalized = input.replace(/H/gi, ':').trim();
    const parts = normalized.split(':');
    if (parts.length !== 2) return null;
    const hours = parseInt(parts[0].trim(), 10);
    const minutes = parseInt(parts[1].trim(), 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };

  // Extrai o nome do professor.
  // Se o valor contém uma barra ("/" ou "\"), retorna a parte após ela;
  // remove vírgulas ou pontos finais indesejados.
  const extractTeacherName = (str) => {
    if (!str) return "";
    // Substitui possíveis barras invertidas por barras normais e remove vírgulas/pontos nos finais.
    let cleaned = str.replace(/[\/\\]/g, "/").replace(/[,;.\s]+$/, "");
    if (cleaned.includes("/")) {
      const parts = cleaned.split("/");
      return parts[parts.length - 1].trim();
    }
    return cleaned.trim();
  };

  // Normaliza uma string: remove acentos, pontuações e espaços extras, e converte para minúsculas.
  const normalizeTeacher = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };

  // Preenche automaticamente o campo de horário com o horário local
  useEffect(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setTimeInput(currentTime);
  }, []);

  // Carrega o CSV de acordo com o dia selecionado
  useEffect(() => {
    let dayToLoad = "";
    const now = new Date();
    const daysArr = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayIndex = now.getDay();
    const currentDay = daysArr[currentDayIndex].toLowerCase();

    if (searchType === "current") {
      dayToLoad = currentDayIndex >= 1 && currentDayIndex <= 5 ? currentDay : 'monday'; // Carrega 'monday' para fins de inicialização/evitar erro se for fim de semana na montagem inicial
    } else {
      dayToLoad = selectedDay;
    }
    const loadCSV = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/data/${dayToLoad}.csv`, {
          headers: {
            'Content-Type': 'text/csv'
          }
        });
        if (!response.ok) {
          if (searchType === "current" && (currentDayIndex === 0 || currentDayIndex === 6)) {
            setData([]); // Define data como vazio para evitar buscas em dias sem arquivo
            setLoading(false);
            return; // Sai da função sem processar erro
          }
          throw new Error("Falha ao carregar o arquivo");
        }
        const csv = await response.text();
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim().replace(/^"|"$/g, ""),
          transform: value => value.trim().replace(/^"|"$/g, ""),
          complete: results => {
            setData(results.data);
            setLoading(false);
          },
          error: err => {
            console.error(err);
            setError("Erro ao carregar os dados do horário.");
            setLoading(false);
          }
        });
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar os dados do horário.");
        setLoading(false);
      }
    };
    loadCSV();
  }, [searchType, selectedDay]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setResult(null);
    setError("");

    if (searchType === "class") {
      if (!timeInput || !endTimeInput || !selectedClass || !selectedDay) {
        setError("Por favor, preencha o dia da semana, horário inicial, final e a turma.");
        return;
      }
      const startInput = parseTimeString(timeInput);
      const endInput = parseTimeString(endTimeInput);
      if (startInput === null || endInput === null) {
        setError("Formato de horário inválido. Use HH:MM (ex.: 09:30).");
        return;
      }
      if (startInput >= endInput) {
        setError("O horário final deve ser após o horário inicial.");
        return;
      }
      const filteredEntries = data.filter(row => {
        if (row["class"] !== selectedClass) return false;
        const lessonStart = parseTimeString(row["time_start"]);
        const lessonEnd = parseTimeString(row["time_end"]);
        if (lessonStart === null || lessonEnd === null) return false;
        return lessonStart < endInput && lessonEnd > startInput;
      }).sort((a, b) => parseTimeString(a["time_start"]) - parseTimeString(b["time_start"]));

      if (filteredEntries.length > 0) {
        setResult({ type: "classList", entries: filteredEntries });
      } else {
        setResult({ type: "none", message: "Nenhuma aula encontrada no intervalo para essa turma." });
      }
    } else if (searchType === "teacher") {
      if (!teacherInput || !selectedDay) {
        setError("Por favor, preencha o dia da semana e o nome do professor.");
        return;
      }
      const teacherQuery = normalizeTeacher(teacherInput);
      const filteredEntries = data.filter(row => {
        const teacherFromCSV = normalizeTeacher(extractTeacherName(row.teacher));
        return row["teacher"] && teacherFromCSV.includes(teacherQuery);
      }).sort((a, b) => parseTimeString(a["time_start"]) - parseTimeString(b["time_start"]));

      if (filteredEntries.length > 0) {
        setResult({ type: "teacherList", entries: filteredEntries });
      } else {
        setResult({ type: "none", message: "Nenhuma aula encontrada para esse professor no dia selecionado." });
      }
    } else if (searchType === "current") {
      if (!selectedClass) {
        setError("Selecione a turma.");
        return;
      }
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setResult({ type: "none", message: "Horário de funcionamento: As aulas têm início às 7h e término às 16h, de segunda a sexta-feira. 🕒." });
        return;
      }

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (now.getHours() < 7 || now.getHours() >= 16) {
        setResult({ type: "none", message: "Horário de funcionamento: As aulas têm início às 7h e término às 16h, de segunda a sexta-feira. 🕒." });
        return;
      }

      // Filtra os dados CARREGADOS (que devem ser do dia atual)
      const currentEntry = data.find(row => {
        return row["class"] === selectedClass &&
               parseTimeString(row["time_start"]) <= nowMinutes &&
               parseTimeString(row["time_end"]) > nowMinutes;
      });

      if (currentEntry) {
        setResult({ type: "current", entry: currentEntry });
      } else {
        setResult({ type: "none", message: "Nenhuma aula ocorrendo agora para essa turma." });
      }
    }
  };

  return (
    <div className="container">
      <h1>Consulta de Horários Escolares</h1>
      <div className="form-group">
        <label>Tipo de Busca</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="class"
              checked={searchType === "class"}
              onChange={() => setSearchType("class")}
            />
            Por Turma e Intervalo
          </label>
          <label>
            <input
              type="radio"
              value="teacher"
              checked={searchType === "teacher"}
              onChange={() => setSearchType("teacher")}
            />
            Por Professor
          </label>
          <label>
            <input
              type="radio"
              value="current"
              checked={searchType === "current"}
              onChange={() => setSearchType("current")}
            />
            Aula Atual na Turma
          </label>
        </div>
      </div>

      {(searchType === "class" || searchType === "teacher") && (
        <div className="form-group">
          <label>Dia da Semana</label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            required
          >
            <option value="">Selecione um dia</option>
            {days.map((day) => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {searchType === "class" ? (
          <>
            <div className="form-group">
              <label>Horário Inicial (ex.: 07:00)</label>
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Horário Final (ex.: 16:00)</label>
              <input
                type="time"
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Turma</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                <option value="">Selecione uma turma</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </>
        ) : searchType === "teacher" ? (
          <>
            <div className="form-group">
              <label>Nome do Professor</label>
              <input
                type="text"
                value={teacherInput}
                onChange={(e) => setTeacherInput(e.target.value)}
                placeholder="Digite o nome do professor"
                required
              />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>Turma</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              required
            >
              <option value="">Selecione uma turma</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Carregando..." : "Consultar"}
        </button>
      </form>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {result && (
        <div className="result">
          {result.type === "classList" ? (
            <div>
              <h3>Aulas no intervalo:</h3>
              <ul>
                {result.entries.map((entry, index) => (
                  <li key={index}>
                    {entry.time_start} - {entry.time_end}: {entry.subject} { entry.teacher ? ` / ${entry.teacher}` : '' }
                  </li>
                ))}
              </ul>
            </div>
          ) : result.type === "teacherList" ? (
            <div>
              <h3>Aulas do Professor:</h3>
              <ul>
                {result.entries.map((entry, index) => (
                  <li key={index}>
                    {entry.time_start} - {entry.time_end}: {entry.class}, {entry.subject}
                  </li>
                ))}
              </ul>
            </div>
          ) : result.type === "current" ? (
            <div>
              <h3>Aula Atual:</h3>
              <p>
                {result.entry.time_start} - {result.entry.time_end}: {result.entry.subject} / {result.entry.teacher}
              </p>
            </div>
          ) : (
            <div>
              <h3>Aviso:</h3>
              <p>{result.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);











