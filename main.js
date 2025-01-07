// main.js

document.addEventListener('DOMContentLoaded', function() {
    const addPartForm = document.getElementById('addPartForm');
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
            const photoGuideText = document.getElementById('photoGuideText');
            const confirmImageButton = document.getElementById('confirmImageButton');
            const retakeImageButton = document.getElementById('retakeImageButton');
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

            uploadImagesButton.addEventListener('click', () => {
                partImagesInput.click();
            });

            partImagesInput.addEventListener('change', () => {
                const files = Array.from(partImagesInput.files);
                files.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const maxWidth = 800; // Set the maximum width
                            const maxHeight = 600; // Set the maximum height
                            let width = img.width;
                            let height = img.height;

                            // Calculate the new dimensions while maintaining the aspect ratio
                            if (width > height) {
                                if (width > maxWidth) {
                                    height = Math.round((height *= maxWidth / width));
                                    width = maxWidth;
                                }
                            } else {
                                if (height > maxHeight) {
                                    width = Math.round((width *= maxHeight / height));
                                    height = maxHeight;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);

                            canvas.toBlob((blob) => {
                                const compressedReader = new FileReader();
                                compressedReader.onload = (event) => {
                                    const compressedImg = document.createElement('div');
                                    compressedImg.classList.add('image-preview');
                                    compressedImg.innerHTML = `
                                        <img src="${event.target.result}" alt="Preview">
                                        <button class="remove-button" data-index="${index}">&times;</button>
                                    `;
                                    imagePreviewContainer.appendChild(compressedImg);
                                    imageFiles.push(event.target.result);

                                    // Update photo guide step
                                    currentStep++;
                                    if (currentStep < photoGuideSteps.length) {
                                        photoGuideText.textContent = photoGuideSteps[currentStep];
                                    } else {
                                        photoGuideText.textContent = "Alle Fotos aufgenommen.";
                                    }
                                };
                                compressedReader.readAsDataURL(blob);
                            }, 'image/jpeg', 0.7); // Adjust the quality as needed
                        };
                        img.src = e.target.result;
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
                    creditAvailable: document.getElementById('creditAvailable').value,
                    images: imageFiles // Assign the images array directly
                };

                console.log('Adding new part:', newPart); // Log the new part for debugging

                if (isEditing) {
                    updatePartInStorage(newPart);
                    document.querySelector(`tr[data-id="${editingId}"]`)?.remove();
                    addPartToTable(newPart);
                    isEditing = false;
                    editingId = null;
                    addButton.textContent = 'Hinzufügen';
                } else {
                    addPartToTable(newPart);
                    savePartToStorage(newPart);
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
                    <td>${part.creditAvailable}</td>
                    <td>
                        <button class="icon-button delete-btn" title="Löschen">
                            <span class="material-icons">delete</span>
                        </button>
                        <button class="icon-button edit-btn" title="Bearbeiten">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="icon-button view-images-btn" title="Bilder anzeigen">
                            <span class="material-icons">photo</span>
                        </button>
                    </td>
                `;
                newRow.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm(`Sind Sie sicher, dass Sie den Eintrag mit dem Kennzeichen "${part.licensePlate}" löschen wollen?`)) {
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
            }

            function renderImagePreviews() {
                imagePreviewContainer.innerHTML = '';
                imageFiles.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('div');
                        img.classList.add('image-preview');
                        img.innerHTML = `
                            <img src="${e.target.result}" alt="Preview">
                            <button class="remove-button" data-index="${index}">&times;</button>
                        `;
                        imagePreviewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
            }
            
            function loadPartsFromStorage() {
                storedParts = JSON.parse(localStorage.getItem('partsData')) || [];
                filteredParts = storedParts;
                renderTable();
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


            // OCR Erkennung
            async function performOCR(imageSrc) {
                const {data: {text}} = await Tesseract.recognize(
                    imageSrc,
                    'eng',
                    {
                        logger: m => console.log(m)
                    }
                );
                return text;
            }

            function displayOCRResults(ocrText) {
                const ocrResultsContainer = document.getElementById('ocrResultsContainer');
                const ocrResultDiv = document.createElement('div');
                ocrResultDiv.classList.add('ocr-result');
                ocrResultDiv.textContent = ocrText;
                ocrResultsContainer.appendChild(ocrResultDiv);
            }

            function removePartFromTable(id) {
                storedParts = storedParts.filter(part => part.id !== id);
                localStorage.setItem('partsData', JSON.stringify(storedParts));
                filteredParts = storedParts;
                renderTable();
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
                document.getElementById('creditAvailable').value = part.creditAvailable;
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
            }

            function savePartToStorage(part) {
                storedParts.push(part);
                localStorage.setItem('partsData', JSON.stringify(storedParts));
                filteredParts = storedParts;
                renderTable();
                updateClearButtonVisibility();
                updateDashboard(); // Aktualisiere die Metriken und Handlungsempfehlungen
            }

            function updatePartInStorage(updatedPart) {
                const partIndex = storedParts.findIndex(part => part.id === updatedPart.id);
                if (partIndex !== -1) storedParts[partIndex] = updatedPart;
                localStorage.setItem('partsData', JSON.stringify(storedParts));
                filteredParts = storedParts;
                renderTable();
                updateClearButtonVisibility();
                updateDashboard(); // Aktualisiere die Metriken und Handlungsempfehlungen
            }

            // Speichern eines Ersatzteils vom Server
            async function savePartToServer(part) {
                try {
                    const response = await fetch('/api/parts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(part)
                    });

                    if (!response.ok) {
                        throw new Error('Fehler beim Speichern des Ersatzteils.');
                    }

                    const savedPart = await response.json();
                    console.log('Saved part:', savedPart); // Log the saved part for debugging
                    updateDashboard();
                    updateClearButtonVisibility();
                } catch (error) {
                    console.error('Fehler beim Speichern des Ersatzteils:', error);
                }
            }
            
            // Laden eines Ersatzteils vom Server
            async function loadPartsFromServer() {
                try {
                    console.log('Fetching parts from server...');
                    const response = await fetch('/api/parts/');

                    if (!response.ok) {
                        throw new Error(`Fehler beim Laden der Ersatzteile. Status: ${response.status}`);
                    }

                    const parts = await response.json();
                    console.log('Parts loaded from server:', parts);
                    filteredParts = parts;
                    renderTable();

                    if (parts.length > 0) {
                        exportButton.classList.remove('hidden');
                    }
                    updateClearButtonVisibility();
                } catch (error) {
                    console.error('Fehler beim Laden der Ersatzteile:', error);
                }
            }


            // Löschen eines Ersatzteils vom Server
            async function removePartFromServer(id) {
                try {
                    const response = await fetch(`/api/parts/${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Failed to delete part.');
                    }

                    document.querySelector(`tr[data-id="${id}"]`).remove();
                    updateDashboard();
                    updateClearButtonVisibility();
                } catch (error) {
                    console.error('Error deleting part from server:', error);
                }
            }

            // Aktualisieren eines Ersatzteils vom Server
            async function updatePartOnServer(updatedPart) {
                try {
                    const response = await fetch(`/api/parts/${updatedPart.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedPart)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update part.');
                    }

                    const savedPart = await response.json();
                    renderTable();
                    updateDashboard();
                    updateClearButtonVisibility();
                } catch (error) {
                    console.error('Error updating part on server:', error);
                }
            }

            function updateClearButtonVisibility() {
                if (storedParts.length > 0) {
                    clearTableButton.classList.remove('hidden');
                } else {
                    clearTableButton.classList.add('hidden');
                }
            }

            function updateDashboard() {
                const notReturnedCount = storedParts.length;
                const totalPrice = storedParts.reduce((sum, part) => sum + parseFloat(part.price || 0), 0);
                const creditPrice = storedParts.filter(part => part.creditAvailable === 'Ja').reduce((sum, part) => sum + parseFloat(part.price || 0), 0);
                const openAmount = totalPrice - creditPrice;

                document.getElementById('notReturnedCount').textContent = notReturnedCount;
                document.getElementById('totalPrice').textContent = `${totalPrice.toFixed(2)} €`;
                document.getElementById('creditPrice').textContent = `${creditPrice.toFixed(2)} €`;
                document.getElementById('openAmount').textContent = `${openAmount.toFixed(2)} €`;

                const recommendationText = document.getElementById('recommendationText');
                if (openAmount > 1000) {
                    recommendationText.textContent = "Bitte auf Gutschriften im WAP achten und ggf. die Liste aktualisieren falls vorhanden um die offenen Beträge zu Beträge reduzieren.";
                } else {
                    recommendationText.textContent = "Keine Empfehlungen verfügbar.";
                }
                document.getElementById('dashboard').classList.remove('hidden');
            }

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
                    part.licensePlate.toLowerCase().includes(searchTerm) ||
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

                // Exportiere die Liste als CSV
                const worksheet = XLSX.utils.json_to_sheet(storedParts);
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                mainFolder.file('Liste.csv', csv);

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
                            creditAvailable: row[headers.indexOf('creditAvailable')] || "Nein",
                            images: []
                        };

                        storedParts.push(newPart);
                    });
                    uniqueId = Math.max(...storedParts.map(part => part.id)) + 1;

                    localStorage.setItem('partsData', JSON.stringify(storedParts));
                    filteredParts = storedParts;
                    renderTable();
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

            window.onload = () => {
                loadPartsFromStorage();
                //loadPartsFromServer();
                updateDashboard();
                updateClearButtonVisibility();
            }; 
});