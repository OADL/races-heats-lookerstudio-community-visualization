/**
 * Looker Studio Community Visualization JavaScript.
 * This script listens for data from Looker Studio, processes it,
 * and renders the structured race and heat tables.
 */

// Define the main container for the visualization
const visContainer = document.getElementById('vis-container');

/**
 * Organizes raw flat data from Looker Studio into a nested structure:
 * {
 * 'Race Name': {
 * 'Heat Name': [
 * { Lane: ..., Name: ..., Age: ..., Academy: ... },
 * ...
 * ],
 * ...
 * },
 * ...
 * }
 * @param {Array<Array<any>>} data The raw data array from Looker Studio.
 * @param {Array<Object>} fields The field definitions from Looker Studio.
 * @returns {Object} The organized nested data structure.
 */
function organizeData(data, fields) {
    const organized = {};
    const fieldMap = {}; // Map field IDs to their index in the data array

    // Create a map for easy lookup of column indices by field ID
    fields.forEach((field, index) => {
        fieldMap[field.id] = index;
    });

    data.forEach(row => {
        // Extract data based on field IDs from the manifest
        const raceName = row[fieldMap.RACE];
        const heatName = row[fieldMap.HEAT];
        const lane = row[fieldMap.LANE];
        const name = row[fieldMap.NAME];
        const age = row[fieldMap.AGEGROUP];
        const academy = row[fieldMap.ACADEMY];

        if (!organized[raceName]) {
            organized[raceName] = {};
        }
        if (!organized[raceName][heatName]) {
            organized[raceName][heatName] = [];
        }
        // Push swimmer details
        organized[raceName][heatName].push({
            Lane: lane,
            Name: name,
            Age: age,
            Academy: academy
        });
    });
    return organized;
}

/**
 * Generates the HTML string for the structured race and heat tables.
 * This function uses the same logic as the previous HTML example,
 * but applies the Tailwind CSS classes directly.
 * @param {Object} organizedData The nested data structure from organizeData.
 * @returns {string} The HTML string.
 */
function generateHtmlTables(organizedData) {
    let html = '';

    // Iterate over each race
    for (const raceName in organizedData) {
        html += `
            <div class="race-container">
                <h2 class="race-title">${raceName}</h2>
        `;

        const heats = organizedData[raceName];
        // Iterate over each heat within the current race
        for (const heatName in heats) {
            const swimmers = heats[heatName];
            html += `
                <div class="heat-container">
                    <h3 class="heat-title">${heatName}</h3>
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600 rounded-tl-md">Lane</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Swimmer</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Age Group</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600 rounded-tr-md">Academy</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            // Iterate over each swimmer in the current heat
            swimmers.forEach((swimmer, index) => {
                html += `
                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-200">
                                    <td class="py-2 px-4 border-b border-gray-200 text-sm text-gray-800 rounded-bl-md">${swimmer.Lane}</td>
                                    <td class="py-2 px-4 border-b border-gray-200 text-sm text-gray-800">${swimmer.Name}</td>
                                    <td class="py-2 px-4 border-b border-gray-200 text-sm text-gray-800">${swimmer.Age}</td>
                                    <td class="py-2 px-4 border-b border-gray-200 text-sm text-gray-800 rounded-br-md">${swimmer.Academy}</td>
                                </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        html += `</div>`; // Close race div
    }
    return html;
}

/**
 * Callback function for Looker Studio's `draw` event.
 * This function is called whenever Looker Studio sends new data or styling.
 * @param {Object} message The message object from Looker Studio containing data and properties.
 */
function drawViz(message) {
    try {
        // Clear previous content
        visContainer.innerHTML = '';

        // Extract data and fields from the message
        const data = message.data.tables.DEFAULT;
        const fields = message.data.fields.DEFAULT;

        // Check if data and fields are available
        if (!data || data.length === 0 || !fields || fields.length === 0) {
            visContainer.innerHTML = '<p class="text-center text-gray-500">No data available. Please ensure dimensions are added to the visualization.</p>';
            return;
        }

        // Organize the data into the desired nested structure
        const organizedData = organizeData(data, fields);

        // Generate the HTML for the tables
        const htmlContent = generateHtmlTables(organizedData);

        // Render the HTML into the container
        visContainer.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error drawing visualization:", error);
        visContainer.innerHTML = `<p class="text-center text-red-500">Error rendering visualization: ${error.message}</p>`;
    }
}

// Add the event listener for Looker Studio's draw event
// This is how Looker Studio communicates with the visualization
if (typeof google !== 'undefined' && google.visualization && google.visualization.events) {
    google.visualization.events.addDomListener(window, 'load', function() {
        google.visualization.events.addListener(google.visualization.Extensibility.V1.CustomVisualization.EventType.INIT, function() {
            google.visualization.Extensibility.V1.CustomVisualization.init();
        });
        google.visualization.Extensibility.V1.CustomVisualization.addDrawListener(drawViz);
    });
} else {
    // Fallback for local testing or environments without Looker Studio API
    console.warn("Looker Studio API not detected. Rendering with sample data for local testing.");
    // You can add a small sample data render here for quick local checks if needed
    // const sampleRawData = [ /* your sample data from previous HTML */ ];
    // const sampleFields = [ /* corresponding field definitions */ ];
    // visContainer.innerHTML = generateHtmlTables(organizeData(sampleRawData, sampleFields));
}
