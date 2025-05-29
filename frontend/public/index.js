const colors = [
  '#3366CC',
  '#DC3912',
  '#FF9900',
  '#109618',
  '#990099',
  '#3B3EAC',
  '#0099C6',
  '#DD4477',
  '#66AA00',
  '#B82E2E',
  '#316395',
  '#994499',
  '#22AA99',
  '#AAAA11',
  '#6633CC',
  '#E67300',
  '#8B0707',
  '#329262',
  '#5574A6',
  '#3B3EAC',
  '#3366CC',
  '#DC3912',
  '#FF9900',
  '#109618',
  '#990099',
  '#3B3EAC',
  '#0099C6',
  '#DD4477',
  '#66AA00',
  '#B82E2E',
  '#316395',
  '#994499',
  '#22AA99',
  '#AAAA11',
  '#6633CC',
  '#E67300',
  '#8B0707',
  '#329262',
  '#5574A6',
  '#3B3EAC'
];

function dataHoraAtual() {
  const now = new Date();
  const nowString =
    now.toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) +
    ' ' +
    now.toLocaleTimeString('pt-BR', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

  const date = document.getElementById('dataHora');
  date.textContent = `gerado em ${nowString}`;
}

function formatDate(date) {
  /*  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`; */

  return new Date(date).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

async function fetchData() {
  dataHoraAtual();

  const dateInput = document.getElementById('date').value;

  const formattedDate = formatDate(new Date(dateInput));

  if (!dateInput) {
    alert('Selecione uma data.');
    return;
  }

  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressBarInner = progressBar.querySelector('div');
  loading.style.display = 'block';
  progressBar.style.display = 'block';
  progressBarInner.style.width = '10%';
  progressBarInner.textContent = '10%';

  try {
    const chart3 = await fetch(`/api/chart/3?date=${dateInput}`);
    progressBarInner.style.width = '12%';
    progressBarInner.textContent = '12%';

    const table1 = await fetch(`/api/table/1?date=${dateInput}`);
    progressBarInner.style.width = '15%';
    progressBarInner.textContent = '15%';

    const chart2 = await fetch(`/api/chart/2?date=${dateInput}`);
    progressBarInner.style.width = '16%';
    progressBarInner.textContent = '16%';

    const table2 = await fetch(`/api/table/2?date=${dateInput}`);
    progressBarInner.style.width = '20%';
    progressBarInner.textContent = '20%';

    const table3 = await fetch(`/api/table/3`);
    progressBarInner.style.width = '22%';
    progressBarInner.textContent = '22%';

    if (!table1.ok) {
      throw new Error('table1', 'Network response was not ok');
    }

    if (!chart3.ok) {
      throw new Error('chart2', 'Network response was not ok');
    }

    if (!table1.ok) {
      throw new Error('table2', 'Network response was not ok');
    }

    if (!table2.ok) {
      throw new Error('chart3', 'Network response was not ok');
    }

    if (!table3.ok) {
      throw new Error('table3', 'Network response was not ok');
    }

    const dfChart2 = await chart2.json();

    const dfChart3 = await chart3.json();
    const dfTable1 = await table1.json();
    const dfTable2 = await table2.json();
    const dfTable3 = await table3.json();

    const gfLinhas = [['Hora', 'Qtd. Batidas', { role: 'annotation' }]];
    const gfPizza = [['Número de Batidas', 'Colaboradores', { role: 'style' }, { role: 'annotation' }]];
    const gfBarras = [['Dia', 'Qtd. Batidas', { role: 'style' }, { role: 'annotation' }]];

    const tableBody1 = document.getElementById('tableBody1');
    const tableHeader1 = document.getElementById('tableHeader1');
    const tableTitle1 = document.getElementById('tableTitle1');
    tableBody1.innerHTML = '';

    const tableBody2 = document.getElementById('tableBody2');
    const tableHeader2 = document.getElementById('tableHeader2');
    const tableTitle2 = document.getElementById('tableTitle2');
    tableBody2.innerHTML = '';

    const tableBody3 = document.getElementById('tableBody3');
    const tableHeader3 = document.getElementById('tableHeader3');
    const tableTitle3 = document.getElementById('tableTitle3');
    tableBody3.innerHTML = '';

    let totalBatidasTable1 = 0;
    let totalBatidasTable2 = 0;

    dfTable1.forEach((row, index) => {
      const tr = document.createElement('tr');

      const dtaBatida = formatDate(new Date(row.dtaBatida));

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${dtaBatida}</td>
        <td>${row.hora}</td>
        <td>${row.qtdRows}</td>
        <td>${row.minBatida}</td>
        <td>${row.maxBatida}</td>
      `;
      tableBody1.appendChild(tr);

      tableHeader1.style.display = 'table-header-group';
      tableTitle1.style.display = 'block';

      gfLinhas.push([row.hora, row.qtdRows, row.qtdRows]);

      totalBatidasTable1 += row.qtdRows;
    });

    const trTotal1 = document.createElement('tr');
    trTotal1.innerHTML = `
      <td colspan="3"><strong>Total</strong></td>
      <td><strong>${totalBatidasTable1}</strong></td>
      <td colspan="2"></td>
    `;
    tableBody1.appendChild(trTotal1);

    progressBarInner.style.width = '55%';
    progressBarInner.textContent = '55%';

    dfChart2.forEach((row, index) => {
      gfPizza.push([row.nroBatidas, row.colaboradores, colors[index], row.colaboradores]);
    });

    // table2 begin
    dfTable2.forEach((row, index) => {
      const tr = document.createElement('tr');

      const dtaBatida = formatDate(new Date(row.dtaBatida));

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${row.loja}</td>
        <td>${row.qtdRelogios}</td>
        <td>${row.qtdBatidas}</td>
        <td>${dtaBatida}</td>
        <td>${row.minBatida}</td>
        <td>${row.maxBatida}</td>
      `;
      tableBody2.appendChild(tr);

      tableHeader2.style.display = 'table-header-group';
      tableTitle2.style.display = 'block';

      totalBatidasTable2 += row.qtdBatidas;
    });

    const trTotal2 = document.createElement('tr');
    trTotal2.innerHTML = `
      <td colspan="3"><strong>Total</strong></td>
      <td><strong>${totalBatidasTable2}</strong></td>
      <td colspan="3"></td>
    `;
    tableBody2.appendChild(trTotal2);

    progressBarInner.style.width = '58%';
    progressBarInner.textContent = '58%';

    // table2 end

    dfChart3.forEach((row, index) => {
      gfBarras.push([row.dtaMes, row.qtdBatidas, colors[index], row.qtdBatidas]);
    });

    progressBarInner.style.width = '64%';
    progressBarInner.textContent = '64%';

    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
      drawChart1(gfLinhas, formattedDate);
      drawChart2(gfPizza, formattedDate);
      drawChart3(gfBarras, formattedDate);

      progressBarInner.style.width = '78%';
      progressBarInner.textContent = '78%';
    });

    // table3 begin

    let totFalhHj = 0;
    let totFalhUltHor = 0;
    let totFalhUlt7d = 0;
    let totFalhUlt15d = 0;
    let totFalhUlt30d = 0;

    dfTable3.forEach((row, index) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${row.loja}</td>
        <td>${row.ip}</td>
        <td>${row.ultima_hora}</td>
        <td>${row.hoje}</td>
        <td>${row.ultimos_7_dias}</td>
        <td>${row.ultimos_15_dias}</td>
        <td>${row.ultimos_30_dias}</td>
        <td>${row.ultima_verificacao}</td>
      `;
      tableBody3.appendChild(tr);

      tableHeader3.style.display = 'table-header-group';
      tableTitle3.style.display = 'block';

      totFalhUltHor += parseInt(row.ultima_hora);
      totFalhHj += parseInt(row.hoje);
      totFalhUlt7d += parseInt(row.ultimos_7_dias);
      totFalhUlt15d += parseInt(row.ultimos_15_dias);
      totFalhUlt30d += parseInt(row.ultimos_30_dias);
    });

    const trTotal3 = document.createElement('tr');
    trTotal3.innerHTML = `
      <td colspan="3"><strong>Total</strong></td>
      <td><strong>${totFalhUltHor}</strong></td>
      <td><strong>${totFalhHj}</strong></td>
      <td><strong>${totFalhUlt7d}</strong></td>
      <td><strong>${totFalhUlt15d}</strong></td>
      <td><strong>${totFalhUlt30d}</strong></td>
      <td colspan="3"></td>`;

    tableBody3.appendChild(trTotal3);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    alert('Erro ao buscar dados. Verifique o console para mais detalhes.');
  } finally {
    loading.style.display = 'none';
    setTimeout(() => {
      progressBar.style.display = 'none';
    }, 500); // Aguarda meio segundo antes de ocultar a barra de progresso
  }

  progressBarInner.style.width = '82%';
  progressBarInner.textContent = '82%';
}

// table3 end

function drawChart3(chartData, date) {
  const data = google.visualization.arrayToDataTable(chartData);

  const options = {
    title: `Importação de Batidas por Dia - ${date}`,
    //curveType: 'function',
    legend: { position: 'top', maxLines: 3 },
    hAxis: {
      title: 'Importação entre 20 Dias Anteriores até a data selecionada',
      slantedText: true,
      slantedTextAngle: 45
    },
    vAxis: {
      title: 'Qtd. Batidas'
    },
    annotations: {
      alwaysOutside: 'true',
      textStyle: {
        fontSize: 12,
        color: '#000'
      }
    }
  };

  const chart = new google.visualization.ColumnChart(document.getElementById('gfBarras1'));

  chart.draw(data, options);
}

function drawChart1(chartData, date) {
  const data = google.visualization.arrayToDataTable(chartData);

  const options = {
    title: `Importação de Batidas por Hora - ${date}`,
    //curveType: 'function',
    legend: { position: 'top', maxLines: 3 },
    hAxis: {
      title: 'Hora',
      slantedText: true, // Permite a rotação dos rótulos
      slantedTextAngle: 45 // Ângulo de rotação dos rótulos
    },
    vAxis: {
      title: 'Qtd. Batidas'
    },
    annotations: { alwaysOutside: 'true' }
  };

  const chart = new google.visualization.LineChart(document.getElementById('gfLinhas1'));

  chart.draw(data, options);
}

function drawChart2(chartData, date) {
  const data = google.visualization.arrayToDataTable(chartData);

  const options = {
    title: `Batidas importadas x Colaboradores - ${date}`,
    legend: { position: 'bottom' },
    hAxis: {
      title: 'Qtd. Batidas ⇔ b = batida(s)',
      slantedText: true,
      slantedTextAngle: 45,
      textStyle: {
        fontSize: 12, // Tamanho da fonte dos rótulos
        color: '#000' // Cor dos rótulos
      }
    },
    vAxis: {
      title: `Colaboradores`
    },
    backgroundColor: 'transparent',
    legend: { position: 'top', maxLines: 3 },
    bar: { groupWidth: '75%' },
    isStacked: true,
    annotations: {
      alwaysOutside: 'true', // Garante que os rótulos sejam exibidos fora das barras
      textStyle: {
        fontSize: 12,
        color: '#000'
      }
    }
  };

  const chart = new google.visualization.PieChart(document.getElementById('gfPizza1'));

  chart.draw(data, options);
}

document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', fetchData);
  } else {
    console.error('Botão de pesquisa não encontrado no DOM.');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
});
