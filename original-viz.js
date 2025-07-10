// Data Studio Community Component library (dscc is globally available in Looker Studio Community Visualizations)

// Helper to group data by a key
function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

// This function is called by Looker Studio to draw the visualization.
const drawViz = (data) => {
  document.body.innerHTML = '';

  // Get the data rows
  const rows = data.tables.DEFAULT.map(row => {
    const [race, heat, lane, name, agegroup, academy] = row.dimension;
    return { race, heat, lane, name, agegroup, academy };
  });

  if (!rows.length) {
    const noData = document.createElement('div');
    noData.className = 'no-data';
    noData.textContent = 'No data available. Please ensure dimensions are added to the visualization.';
    document.body.appendChild(noData);
    return;
  }

  // Assume all rows are for the same race (filtered in Looker Studio)
  const raceName = rows[0].race;

  // Group by heat
  const heats = groupBy(rows, 'heat');

  // Main container
  const app = document.createElement('div');
  app.id = 'app';

  // Race title
  const raceTitle = document.createElement('h1');
  raceTitle.className = 'main-title';
  raceTitle.textContent = `Race: ${raceName}`;
  app.appendChild(raceTitle);

  // For each heat
  Object.entries(heats).forEach(([heatName, swimmers]) => {
    const heatDiv = document.createElement('div');
    heatDiv.className = 'heat-container';

    const heatTitle = document.createElement('h2');
    heatTitle.className = 'heat-title';
    heatTitle.textContent = `Heat: ${heatName}`;
    heatDiv.appendChild(heatTitle);

    // Table wrapper
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'data-table-wrapper';

    // Table
    const table = document.createElement('table');
    table.className = 'data-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Lane</th><th>Name</th><th>Age Group</th><th>Academy</th></tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    swimmers.forEach(swimmer => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${swimmer.lane}</td><td>${swimmer.name}</td><td>${swimmer.agegroup}</td><td>${swimmer.academy}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    heatDiv.appendChild(tableWrapper);
    app.appendChild(heatDiv);
  });

  document.body.appendChild(app);
};

dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});