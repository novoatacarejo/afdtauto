function dataHoraAtual() {
  const now = new Date();
  const nowString =
    now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) +
    ' ' +
    now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

  const date = document.getElementById('dataHora');
  date.textContent = `gerado em ${nowString}`;
}

async function fetchData() {
  dataHoraAtual();

  const dateInput = document.getElementById('date').value;

  if (!dateInput) {
    alert('Selecione uma data.');
    return;
  }

  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressBarInner = progressBar.querySelector('div');
  loading.style.display = 'block';
  progressBar.style.display = 'block';
  progressBarInner.style.width = '0%';
  progressBarInner.textContent = '0%';

  try {
    const response1 = await fetch(`/date?date=${dateInput}`);
    progressBarInner.style.width = '50%';
    progressBarInner.textContent = '50%';

    const response2 = await fetch(`/chart2?date=${dateInput}`);
    progressBarInner.style.width = '75%';
    progressBarInner.textContent = '75%';

    if (!response1.ok) {
      throw new Error('chart1', 'Network response was not ok');
    }

    if (!response2.ok) {
      throw new Error('chart2', 'Network response was not ok');
    }

    const data1 = await response1.json();
    const data2 = await response2.json();

    const tableBody = document.getElementById('tableBody');
    const tableHeader = document.getElementById('tableHeader');
    tableBody.innerHTML = '';

    const dataChart1 = [['Hora', 'Qtd. Batidas']];
    const dataChart2 = [['Número de Batidas', 'Colaboradores']];

    let totalBatidas = 0;

    data1.forEach((row, index) => {
      const tr = document.createElement('tr');

      const formattedDate = new Date(row.dtaBatida).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${formattedDate}</td>
        <td>${row.hora}</td>
        <td>${row.qtdRows}</td>
        <td>${row.minBatida}</td>
        <td>${row.maxBatida}</td>
      `;
      tableBody.appendChild(tr);

      tableHeader.style.display = 'table-header-group';

      dataChart1.push([row.hora, row.qtdRows]);

      totalBatidas += row.qtdRows;
    });

    data2.forEach((row, index) => {
      dataChart2.push([row.nroBatidas, row.colaboradores]);
    });

    const trTotal = document.createElement('tr');
    trTotal.innerHTML = `
      <td colspan="3"><strong>Total</strong></td>
      <td><strong>${totalBatidas}</strong></td>
      <td colspan="2"></td>
    `;
    tableBody.appendChild(trTotal);

    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
      drawChart1(dataChart1);
      drawChart2(dataChart2);

      progressBarInner.style.width = '100%';
      progressBarInner.textContent = '100%';
    });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    alert('Erro ao buscar dados. Verifique o console para mais detalhes.');
  } finally {
    loading.style.display = 'none';
    setTimeout(() => {
      progressBar.style.display = 'none';
    }, 500); // Aguarda meio segundo antes de ocultar a barra de progresso
  }
}

function drawChart1(chartData) {
  const data = google.visualization.arrayToDataTable(chartData);

  const options = {
    title: `Batidas por Hora`,
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

  const chart = new google.visualization.LineChart(document.getElementById('chart1'));

  chart.draw(data, options);
}

function drawChart2(chartData) {
  const data = google.visualization.arrayToDataTable(chartData);

  const options = {
    title: 'Batidas x Colaboradores',
    legend: { position: 'bottom' },
    hAxis: {
      title: 'Colaborador',
      slantedText: true,
      slantedTextAngle: 45,
      textStyle: {
        fontSize: 12, // Tamanho da fonte dos rótulos
        color: '#000' // Cor dos rótulos
      }
    },
    vAxis: {
      title: 'Número de Batidas'
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

  const chart = new google.visualization.ColumnChart(document.getElementById('chart2'));

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
