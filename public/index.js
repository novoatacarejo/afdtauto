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

  try {
    const response = await fetch(`/date?date=${dateInput}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();

    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const chartData = [['Hora', 'Qtd. Batidas']];

    data.forEach((row, index) => {
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

      chartData.push([row.hora, row.qtdRows]);
    });

    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => drawChart(chartData));
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    alert('Erro ao buscar dados. Verifique o console para mais detalhes.');
  }
}

function drawChart(chartData) {
  const data = google.visualization.arrayToDataTable(chartData);

  const options = {
    title: 'Qtd. Batidas por Hora',
    //curveType: 'function',
    legend: { position: 'bottom' },
    hAxis: {
      title: 'Hora',
      slantedText: true, // Permite a rotação dos rótulos
      slantedTextAngle: 45 // Ângulo de rotação dos rótulos
    },
    vAxis: {
      title: 'Qtd. Batidas'
    }
  };

  const chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

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
