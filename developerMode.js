// developerMode.js

document.addEventListener('DOMContentLoaded', function() {
    const developerModeToggle = document.getElementById('developerModeToggle');
    const developerButtons = document.getElementById('developerButtons');
    const loadListeButton = document.getElementById('loadListeButton');
    const loadExcelDataButton = document.getElementById('loadExcelDataButton');

    developerModeToggle.addEventListener('change', () => {
        if (developerModeToggle.checked) {
            developerButtons.classList.add('visible');
        } else {
            developerButtons.classList.remove('visible');
        }
    });

    loadListeButton.addEventListener('click', () => {
        loadExcelData('Liste.xlsx');
    });

    loadExcelDataButton.addEventListener('click', () => {
        loadExcelData('excelData.xlsx');
    });

    function loadExcelData(fileName) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx';
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const importedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    const headers = importedData[0];
                    importedData.slice(1).forEach((row, index) => {
                        const newPart = {
                            id: uniqueId++,
                            licensePlate: row[headers.indexOf('licensePlate')] || `Unbekannt ${index}`,
                            partNumber: row[headers.indexOf('partNumber')] || "",
                            description: row[headers.indexOf('description')] || "",
                            complaintDate: row[headers.indexOf('complaintDate')] || "",
                            reason: row[headers.indexOf('reason')] || "",
                            price: row[headers.indexOf('price')] || "0",
                            remarks: row[headers.indexOf('remarks')] || "",
                            retoureLabelReceived: row[headers.indexOf('retoureLabelReceived')] || "Nein",
                            images: []
                        };
                        storedParts.push(newPart);
                    });

                    // Ensure unique IDs for all parts
                    if (storedParts.length > 0) {
                        uniqueId = Math.max(...storedParts.map(part => part.id)) + 1;
                    } else {
                        uniqueId = 1;
                    }

                    // Store the imported data in localStorage
                    localStorage.setItem('partsData', JSON.stringify(storedParts));
                    filteredParts = storedParts;

                    // Render the table with the imported data
                    renderTable();
                    updateDashboard();
                    exportButton.classList.remove('hidden');
                    updateClearButtonVisibility();
                    alert("Import erfolgreich abgeschlossen!");
                };
                reader.onerror = (error) => {
                    alert("Fehler beim Lesen der Datei: " + error.message);
                };
                reader.readAsArrayBuffer(file);
            }
        });
        fileInput.click();
    }
});