// main.js

document.addEventListener('DOMContentLoaded', function() {
    
    const addPartForm = document.getElementById('addPartForm');
    const filterLicensePlate = document.getElementById('filterLicensePlate');
    const filterPartNumber = document.getElementById('filterPartNumber');
    const filterReason = document.getElementById('filterReason');
    const filterDate = document.getElementById('filterDate');
    const filterInterval = document.getElementById('filterInterval');
    const applyFiltersButton = document.getElementById('applyFiltersButton');
    const clearFiltersButton = document.getElementById('clearFiltersButton');
    const filterStartDate = document.getElementById('filterStartDate');
    const filterEndDate = document.getElementById('filterEndDate');


    const scrollToTableDiv = document.getElementById('scrollToTableDiv');
    const partsTable = document.getElementById('partsTable');
    const partsTableBody = document.querySelector('#partsTable tbody');
    const exportButton = document.getElementById('exportButton');
    const addButton = addPartForm.querySelector('button[type="submit"]');
    const clearTableButton = document.getElementById('clearTableButton');
    const entriesPerPageSelect = document.getElementById('entriesPerPage');
    const prevPageButton = document.getElementById('prevPageButton');
    const nextPageButton = document.getElementById('nextPageButton');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const partImagesInput = document.getElementById('partImages');
    const uploadImagesButton = document.getElementById('uploadImagesButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreviewOverlay = document.getElementById('imagePreviewOverlay');
    const previewImage = document.getElementById('previewImage');
    const closePreviewButton = document.getElementById('closePreviewButton');
    const confirmImageButton = document.getElementById('confirmImageButton');
    const retakeImageButton = document.getElementById('retakeImageButton');
    const photoGuideText = document.getElementById('photoGuideText');
    const photoGuideSteps = [
        "Foto 1: Bitte mach ein Foto von dem Versandkarton",
        "Foto 2: Mache ein zweites Foto von dem Versandkarton (z.B. vom Versandetikett)",
        "Foto 3: Mache ein Foto vom verpackten Ersatzteil (in der Regel in der Folie im Karton)",
        "Foto 4: Mache ein zweites Foto vom verpackten Ersatzteil",
        "Foto 5: Mache ein Foto von dem beschädigten Ersatzteil",
        "Foto 6: Mache ein zweites Foto von dem beschädigten Ersatzteil",
        "Foto 7: Mache ein drittes Foto von dem beschädigten Ersatzteil",
        "Foto 8: Mache ein viertes Foto von dem beschädigten Ersatzteil"
    ];
    let currentStep = 0;
    let imageFiles = [];
    let uniqueId = 0;
    let isEditing = false;
    let editingId = null;
    let currentPage = 1;
    let entriesPerPage = parseInt(entriesPerPageSelect.value, 10);
    let storedParts = [];
    let filteredParts = [];
    let partsChart;
    //let priceChart;
    let timeSeriesChart;

    filterForm.addEventListener('submit', function(event){
        event.preventDefault();
        applyFilters();
    })

    scrollToTableDiv.addEventListener('click', function() {
        partsTable.scrollIntoView({ behavior: 'smooth' });
    });

    toggleFiltersButton.addEventListener('click', function() {
        if (filterOptions.classList.contains('hidden')) {
            filterOptions.classList.remove('hidden');
            filterOptions.classList.add('show');
            toggleFiltersButton.textContent = 'Filteroptionen ausblenden';
        } else {
            filterOptions.classList.remove('show');
            filterOptions.classList.add('hidden');
            toggleFiltersButton.textContent = 'Filteroptionen anzeigen';
        }
    });


    function initializeExcelSheet() {
        if (!localStorage.getItem('excelData')) {
            const workbook = XLSX.utils.book_new();
            const worksheetData = [
                ["ID", "Kennzeichen", "Teilenummer", "Beschreibung", "Reklamationsdatum", "Grund", "Preis", "Bemerkung", "Retoure-Label erhalten"]
            ];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Parts');
            const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            localStorage.setItem('excelData', JSON.stringify(Array.from(new Uint8Array(xlsxData))));
        }
    }

    uploadImagesButton.addEventListener('click', () => {
        partImagesInput.click();
    });

    partImagesInput.addEventListener('change', () => {
        const files = Array.from(partImagesInput.files);
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                imagePreviewOverlay.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    });

    confirmImageButton.addEventListener('click', () => {
        const img = document.createElement('div');
        img.classList.add('image-preview');
        img.innerHTML = `
            <img src="${previewImage.src}" alt="Preview">
            <button class="remove-button" data-index="${currentStep}">&times;</button>
        `;
        imagePreviewContainer.appendChild(img);
        imageFiles.push(previewImage.src);
        currentStep++;
        if (currentStep < photoGuideSteps.length) {
            photoGuideText.textContent = photoGuideSteps[currentStep];
        } else {
            photoGuideText.textContent = "Alle Fotos aufgenommen.";
        }
        imagePreviewOverlay.style.display = 'none';
    });

    retakeImageButton.addEventListener('click', () => {
        partImagesInput.value = '';
        imagePreviewOverlay.style.display = 'none';
    });
    
    closePreviewButton.addEventListener('click', () => {
        imagePreviewOverlay.style.display = 'none';
    });

    imagePreviewContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-button')) {
            const index = e.target.getAttribute('data-index');
            imageFiles.splice(index, 1);
            e.target.parentElement.remove();
            currentStep--;
            if (currentStep < photoGuideSteps.length) {
                photoGuideText.textContent = photoGuideSteps[currentStep];
            } else {
                photoGuideText.textContent = "Alle Fotos aufgenommen.";
            }
        }
    });

    addPartForm.addEventListener('submit', event => {
        event.preventDefault();

        const newPart = {
            id: isEditing ? editingId : uniqueId++,
            licensePlate: document.getElementById('licensePlate').value,
            partNumber: document.getElementById('partNumber').value,
            description: document.getElementById('description').value,
            complaintDate: document.getElementById('complaintDate').value,
            reason: document.getElementById('reason').value,
            price: document.getElementById('price').value,
            remarks: document.getElementById('remarks').value,
            retoureLabelReceived: document.getElementById('retoureLabelReceived').value || "Nein",
            images: imageFiles // Assign the images array directly
        };

        console.log('Adding new part:', newPart); // Log the new part for debugging

        if (isEditing) {
            updatePartInStorage(newPart);
            updatePartInExcel(newPart); // Update the Excel sheet
            document.querySelector(`tr[data-id="${editingId}"]`)?.remove();
            addPartToTable(newPart);
            isEditing = false;
            editingId = null;
            addButton.textContent = 'Hinzufügen';
        } else {
            addPartToTable(newPart);
            savePartToStorage(newPart);
            addPartToExcel(newPart); // Add to the Excel sheet
        }

        exportButton.classList.remove('hidden');
        addPartForm.reset();
        imagePreviewContainer.innerHTML = '';
        imageFiles = [];
        currentStep = 0;
        photoGuideText.textContent = photoGuideSteps[currentStep];
        updateDashboard();
        updateClearButtonVisibility();

        // Call renderImagePreviews to update the image previews
        renderImagePreviews();
    });

    function addPartToTable(part) {
        const newRow = document.createElement('tr');
        newRow.dataset.id = part.id;
        newRow.innerHTML = `
            <td>${part.licensePlate}</td>
            <td>${part.partNumber}</td>
            <td>${part.description}</td>
            <td>${part.complaintDate}</td>
            <td>${part.reason}</td>
            <td>${part.price}</td>
            <td>${part.remarks}</td>
            <td>${part.retoureLabelReceived}</td>
            <td>
                <button class="icon-button delete-btn" title="Löschen">
                    <span class="material-icons">delete</span>
                </button>
                <br>
                <button class="icon-button edit-btn" title="Bearbeiten">
                    <span class="material-icons">edit</span>
                </button>
                <br>
                <button class="icon-button view-images-btn" title="Bilder anzeigen">
                    <span class="material-icons">photo</span>
                </button>
            </td>
        `;

        newRow.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`Achtung\!\!\! \n \n Sind Sie sicher, dass Sie den Eintrag mit dem Kennzeichen "${part.licensePlate}" löschen wollen?`)) {
                removePartFromTable(part.id);
            }
        });

        newRow.querySelector('.edit-btn').addEventListener('click', () => loadPartToForm(part));

        newRow.querySelector('.view-images-btn').addEventListener('click', () => {
            if (!part.images || part.images.length === 0) {
                if (confirm("Es wurden noch keine Bilder hinzugefügt. Möchten Sie jetzt Bilder hinzufügen?")) {
                    partImagesInput.click();
                }
            } else {
                viewImages(part.images);
            }
        });

        partsTableBody.appendChild(newRow);
    }

    function savePartToStorage(part) {
        const storedParts = JSON.parse(localStorage.getItem('partsData')) || [];
        storedParts.push(part);
        localStorage.setItem('partsData', JSON.stringify(storedParts));
        filteredParts = storedParts;
        renderTable();
        updateClearButtonVisibility();
        updateDashboard(); // Aktualisiere die Metriken und Handlungsempfehlungen
    }

    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = '';
        imageFiles.forEach((src, index) => {
            const img = document.createElement('div');
            img.classList.add('image-preview');
            img.innerHTML = `
                <img src="${src}" alt="Preview">
                <button class="remove-button" data-index="${index}">&times;</button>
            `;
            imagePreviewContainer.appendChild(img);
        });
    }
    
    function loadPartsFromStorage() {
        storedParts = JSON.parse(localStorage.getItem('partsData')) || [];
        filteredParts = storedParts;
        renderTable();
        updateFilterOptions();
        if (storedParts.length > 0) exportButton.classList.remove('hidden');
        updateClearButtonVisibility();
    }

    function renderTable() {
        console.log('Rendering table...');
        partsTableBody.innerHTML = '';
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const partsToDisplay = filteredParts.slice(start, end);

        partsToDisplay.forEach(addPartToTable);
        updatePaginationButtons();
    }

    function viewImages(images) {
        const imageModal = document.createElement('div');
        imageModal.classList.add('image-modal');
        imageModal.innerHTML = `
            <div class="image-modal-content">
                <span class="close-button">&times;</span>
                <div class="image-gallery"></div>
            </div>
        `;
        document.body.appendChild(imageModal);

        const imageGallery = imageModal.querySelector('.image-gallery');
        images.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('image-preview');
            imageGallery.appendChild(img);
        });

        const closeButton = imageModal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(imageModal);
        });
    }

    function removePartFromTable(id) {
        storedParts = storedParts.filter(part => part.id !== id);
        localStorage.setItem('partsData', JSON.stringify(storedParts));
        filteredParts = storedParts;
        renderTable();
        updateFilterOptions();
        deletePartFromExcel(id); // Delete from the Excel sheet
        if (!partsTableBody.children.length) exportButton.classList.add('hidden');
        updateClearButtonVisibility();
        updateDashboard(); // Aktualisiere die Metriken und Handlungsempfehlungen
    }

    function loadPartToForm(part) {
        document.getElementById('licensePlate').value = part.licensePlate;
        document.getElementById('partNumber').value = part.partNumber;
        document.getElementById('description').value = part.description;
        document.getElementById('complaintDate').value = part.complaintDate;
        document.getElementById('reason').value = part.reason;
        document.getElementById('price').value = part.price;
        document.getElementById('remarks').value = part.remarks;
        document.getElementById('retoureLabelReceived').value = part.retoureLabelReceived;
        addButton.textContent = 'Speichern';
        isEditing = true;
        editingId = part.id;

        // Bilder laden
        imagePreviewContainer.innerHTML = '';
        part.images.forEach((src, index) => {
            const img = document.createElement('div');
            img.classList.add('image-preview');
            img.innerHTML = `
                <img src="${src}" alt="Preview">
                <button class="remove-button" data-index="${index}">&times;</button>
            `;
            imagePreviewContainer.appendChild(img);
        });

        // Scroll to the form
        document.getElementById('addPartForm').scrollIntoView({ behavior: 'smooth' });
    }

    function savePartToStorage(part) {
        storedParts.push(part);
        localStorage.setItem('partsData', JSON.stringify(storedParts));
        filteredParts = storedParts;
        renderTable();
        updateFilterOptions();
        updateClearButtonVisibility();
        updateDashboard(); // Aktualisiere die Metriken und Handlungsempfehlungen
    }

    function updatePartInStorage(updatedPart) {
        const partIndex = storedParts.findIndex(part => part.id === updatedPart.id);
        if (partIndex !== -1) storedParts[partIndex] = updatedPart;
        localStorage.setItem('partsData', JSON.stringify(storedParts));
        filteredParts = storedParts;
        renderTable();
        updateFilterOptions();
        updateClearButtonVisibility();
        updateDashboard(); // Aktualisiere die Metriken und Handlungsempfehlungen
    }

    function updateClearButtonVisibility() {
        if (storedParts.length > 0) {
            clearTableButton.classList.remove('hidden');
        } else {
            clearTableButton.classList.add('hidden');
        }
    }

    function addPartToExcel(part) {
        const storedExcelData = JSON.parse(localStorage.getItem('excelData'));
        const workbook = XLSX.read(new Uint8Array(storedExcelData), { type: 'array' });
        const worksheet = workbook.Sheets['Parts'];
        const parts = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const newRow = [
            part.id,
            part.licensePlate,
            part.partNumber,
            part.description,
            part.complaintDate,
            part.reason,
            part.price,
            part.remarks,
            part.retoureLabelReceived
        ];
        parts.push(newRow);
        const newWorksheet = XLSX.utils.aoa_to_sheet(parts);
        workbook.Sheets['Parts'] = newWorksheet;
        const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        localStorage.setItem('excelData', JSON.stringify(Array.from(new Uint8Array(xlsxData))));
    }
    
    function updatePartInExcel(updatedPart) {
        const storedExcelData = JSON.parse(localStorage.getItem('excelData'));
        const workbook = XLSX.read(new Uint8Array(storedExcelData), { type: 'array' });
        const worksheet = workbook.Sheets['Parts'];
        const parts = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const partIndex = parts.findIndex(row => row[0] === updatedPart.id);
        if (partIndex !== -1) {
            parts[partIndex] = [
                updatedPart.id,
                updatedPart.licensePlate,
                updatedPart.partNumber,
                updatedPart.description,
                updatedPart.complaintDate,
                updatedPart.reason,
                updatedPart.price,
                updatedPart.remarks,
                updatedPart.retoureLabelReceived
            ];
            const newWorksheet = XLSX.utils.aoa_to_sheet(parts);
            workbook.Sheets['Parts'] = newWorksheet;
            const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            localStorage.setItem('excelData', JSON.stringify(Array.from(new Uint8Array(xlsxData))));
        }
    }
    
    function deletePartFromExcel(id) {
        const storedExcelData = JSON.parse(localStorage.getItem('excelData'));
        const workbook = XLSX.read(new Uint8Array(storedExcelData), { type: 'array' });
        const worksheet = workbook.Sheets['Parts'];
        let parts = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        parts = parts.filter(row => row[0] !== id);
        const newWorksheet = XLSX.utils.aoa_to_sheet(parts);
        workbook.Sheets['Parts'] = newWorksheet;
        const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        localStorage.setItem('excelData', JSON.stringify(Array.from(new Uint8Array(xlsxData))));
    }

    function updateDashboard() {
        const notReturnedCount = storedParts.length;
        const totalPrice = storedParts.reduce((sum, part) => sum + parseFloat(part.price || 0), 0);
        const returnedParts = storedParts.filter(part => part.retoureLabelReceived === 'Ja');
        const returnedCount = returnedParts.length;
        const returnedPrice = returnedParts.reduce((sum, part) => sum + parseFloat(part.price || 0), 0);
        const openAmount = totalPrice - returnedPrice;

        document.getElementById('notReturnedCount').textContent = notReturnedCount;
        document.getElementById('totalPrice').textContent = `${totalPrice.toFixed(2)} €`;
        document.getElementById('returnedCount').textContent = returnedCount;
        document.getElementById('returnedPrice').textContent = `${returnedPrice.toFixed(2)} €`;

        const recommendationText = document.getElementById('recommendationText');
        if (openAmount > 1000) {
            recommendationText.textContent = "Bitte auf Gutschriften im WAP achten und ggf. die Liste aktualisieren falls vorhanden um die offenen Beträge zu reduzieren.";
        } else {
            recommendationText.textContent = "Keine Empfehlungen verfügbar.";
        }
        document.getElementById('dashboard').classList.remove('hidden');

        //updateCharts(notReturnedCount, returnedCount, totalPrice, returnedPrice);
    }
    
    /* function updateCharts(notReturnedCount, returnedCount, totalPrice, returnedPrice) {
        
                
        const partsChartCtx = document.getElementById('partsChart').getContext('2d');
        //const priceChartCtx = document.getElementById('priceChart').getContext('2d');
        const timeSeriesChartCtx = document.getElementById('timeSeriesChart').getContext('2d');

        // Destroy existing charts if they exist
        if (partsChart) {
            partsChart.destroy();
            partsChart = null;
        }


        // Parts Chart
        partsChart = new Chart(partsChartCtx, {
            type: 'pie',
            data: {
                labels: ['Nicht retournierte Teile', 'Erfolgreich retournierte Teile'],
                datasets: [{
                    data: [notReturnedCount, returnedCount],
                    backgroundColor: ['#ff6384', '#36a2eb']
                }]
            },
            options: {
                
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Teile Status'
                    }
                }
            }
        });

        // Time Series Chart
        updateTimeSeriesChart();
    }
 
    function updateTimeSeriesChart() {
        const timeSeriesChartCtx = document.getElementById('timeSeriesChart').getContext('2d');
        const interval = filterInterval.value;
        const dates = storedParts.map(part => part.complaintDate);
        const counts = dates.reduce((acc, date) => {
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const sortedDates = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b));
        const sortedCounts = sortedDates.map(date => counts[date]);

        // Destroy existing time series chart if it exists
        if (timeSeriesChart) {
            timeSeriesChart.destroy();
            timeSeriesChart = null;
        }

        timeSeriesChart = new Chart(timeSeriesChartCtx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Anzahl der Ersatzteile',
                    data: sortedCounts,
                    borderColor: '#36a2eb',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: interval,
                            tooltipFormat: 'DD/MM/YYYY'
                        },
                        title: {
                            display: true,
                            text: 'Datum'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1, // Ensure only whole numbers are displayed
                            callback: function(value) {
                                if (Number.isInteger(value)) {
                                    return value;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Anzahl der Ersatzteile'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Ersatzteile über die Zeit'
                    }
                }
            }
        });
    }  */

    function updatePaginationButtons() {
        const totalPages = Math.ceil(filteredParts.length / entriesPerPage);
        document.getElementById('pageInfo').textContent = `Seite ${currentPage} von ${totalPages}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage >= totalPages;
    }

    entriesPerPageSelect.addEventListener('change', () => {
        entriesPerPage = parseInt(entriesPerPageSelect.value, 10);
        currentPage = 1;
        renderTable();
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageButton.addEventListener('click', () => {
        if (currentPage * entriesPerPage < filteredParts.length) {
            currentPage++;
            renderTable();
        }
    });

    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filteredParts = storedParts.filter(part => 
            part.licensePlate.toLowerCase().replace(/\s+/g, '').replace(/-/g, '').includes(searchTerm) ||
        part.partNumber.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        renderTable();
        clearSearchButton.classList.remove('hidden');
    });

    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        filteredParts = storedParts;
        currentPage = 1;
        renderTable();
        clearSearchButton.classList.add('hidden');
    });

    exportButton.addEventListener('click', () => {
        const zip = new JSZip();
        const folderName = `Retoure-Ersatzteil-${new Date().toLocaleDateString('de-DE')}`;
        const mainFolder = zip.folder(folderName);
        const imagesFolder = mainFolder.folder('Bilder');
    
        // Erstellen einer Kopie der Daten ohne die `images`-Eigenschaft und ohne leere `id`-Eigenschaft
        const dataWithoutImages = storedParts.map(({ images, id, ...rest }) => {
            // Filtere die `id`-Eigenschaft nur ein, wenn sie nicht leer ist
            let filteredData = { ...rest };
            if (id) {
                filteredData.id = id;
            }
            return filteredData;
        });
    
        // Exportiere die Liste als XLSX
        const worksheet = XLSX.utils.json_to_sheet(dataWithoutImages);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Liste');
        const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        mainFolder.file('Liste.xlsx', xlsxData);
    
        // Füge die Bilder hinzu
        storedParts.forEach(part => {
            const partFolderName = `${part.licensePlate}-${part.partNumber}-${new Date(part.complaintDate).toLocaleDateString('de-DE')}`;
            const partFolder = imagesFolder.folder(partFolderName);
            part.images.forEach((image, index) => {
                const base64Data = image.split(',')[1];
                partFolder.file(`Bild-${index + 1}.jpg`, base64Data, { base64: true });
            });
        });
    
        // Generiere das ZIP-Archiv und speichere es
        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, `${folderName}.zip`);
        });
    });
    

    clearTableButton.addEventListener('click', () => {
        if (confirm("Sind Sie sicher, dass Sie alle Einträge löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.")) {
            localStorage.removeItem('partsData');
            storedParts = [];
            filteredParts = [];
            renderTable();
            exportButton.classList.add('hidden');
            clearTableButton.classList.add('hidden');
            updateDashboard(); // Aktualisiere die Metriken und Handlungsempfehlungen
            alert("Alle Einträge wurden gelöscht.");
        }
    });
    
    document.getElementById('importButton').addEventListener('click', () => {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];

        if (!file) {
            alert("Bitte wählen Sie eine Datei aus.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
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
            updateFilterOptions(); // Update filter options
            updateDashboard();
            exportButton.classList.remove('hidden');
            updateClearButtonVisibility();
            alert("Import erfolgreich abgeschlossen!");
        };

        reader.onerror = (error) => {
            alert("Fehler beim Lesen der Datei: " + error.message);
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
        });

        
    
        applyFiltersButton.addEventListener('click', () => {
            applyFilters();
        });
    
        clearFiltersButton.addEventListener('click', () => {
            clearFilters();
        });
        
        const filterDescription = document.getElementById('filterDescription');

        function applyFilters() {
            const licensePlateFilter = filterLicensePlate.value.toLowerCase();
            const partNumberFilter = filterPartNumber.value.toLowerCase();
            const reasonFilter = filterReason.value;
            const descriptionFilter = filterDescription.value.toLowerCase();
            const dateFilter = filterDate.value;
            const startDateFilter = filterStartDate.value;
            const endDateFilter = filterEndDate.value;
    
            filteredParts = storedParts.filter(part => {
                const matchesLicensePlate = part.licensePlate.toLowerCase().includes(licensePlateFilter);
                const matchesPartNumber = part.partNumber.toLowerCase().includes(partNumberFilter);
                const matchesReason = reasonFilter === '' || part.reason === reasonFilter;
                const matchesDescription = part.description.toLowerCase().includes(descriptionFilter);
                const matchesDate = dateFilter === '' || part.complaintDate === dateFilter;
                const matchesStartDate = startDateFilter === '' || new Date(part.complaintDate) >= new Date(startDateFilter);
                const matchesEndDate = endDateFilter === '' || new Date(part.complaintDate) <= new Date(endDateFilter);

                return matchesLicensePlate && matchesPartNumber && matchesReason && matchesDescription && matchesDate && matchesStartDate && matchesEndDate;
            });
            filteredParts.sort((a, b) => new Date(a.complaintDate) - new Date(b.complaintDate));

            currentPage = 1;
            renderTable();
        }

        applyFiltersButton.addEventListener('click', applyFilters);
        clearFiltersButton.addEventListener('click', () => {
            filterLicensePlate.value = '';
            filterPartNumber.value = '';
            filterReason.value = '';
            filterDescription.value = '';
            filterDate.value = '';
            filterStartDate.value = '';
            filterEndDate.value = '';
            applyFilters();
        });

        function updateFilterOptions() {
            const licensePlateSet = new Set();
            const partNumberSet = new Set();
            const reasonSet = new Set();
            const descriptionSet = new Set();

            storedParts.forEach(part => {
                licensePlateSet.add(part.licensePlate);
                partNumberSet.add(part.partNumber);
                reasonSet.add(part.reason);
                descriptionSet.add(part.description);
            });

            const sortedLicensePlates = Array.from(licensePlateSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const sortedPartNumbers = Array.from(partNumberSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const sortedDescriptions = Array.from(descriptionSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const sortedReasons = Array.from(reasonSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            updateSelectOptions(document.getElementById('filterLicensePlate'), sortedLicensePlates);
            updateSelectOptions(document.getElementById('filterPartNumber'), sortedPartNumbers);
            updateSelectOptions(document.getElementById('filterDescription'), sortedDescriptions);
            updateSelectOptions(document.getElementById('filterReason'), sortedReasons);
        }

        function updateSelectOptions(selectElement, optionsArray) {
            selectElement.innerHTML = '<option value="">Alle</option>'; // Reset options
            optionsArray.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                selectElement.appendChild(optionElement);
            });
        }
    
        function clearFilters() {
            filterLicensePlate.value = '';
            filterPartNumber.value = '';
            filterReason.value = '';
            filterDescription.value = '';
            filterDate.value = '';
            filterStartDate.value = '';
            filterEndDate.value = '';
            filteredParts = storedParts;
            currentPage = 1;
            renderTable();
        }

    window.onload = () => {
        initializeExcelSheet();
        loadPartsFromStorage();
        updateFilterOptions();
        //updateCharts(); //this is for later
        updateDashboard();
        updateClearButtonVisibility();
        
    }; 
});