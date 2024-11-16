document.addEventListener('DOMContentLoaded', () => {
    // Main image elements
    const mainDropZone = document.getElementById('mainDropZone');
    const mainFileInput = document.getElementById('mainFileInput');
    const imagePreview = document.getElementById('imagePreview');

    // Overlay image elements
    const overlayDropZone = document.getElementById('overlayDropZone');
    const overlayFileInput = document.getElementById('overlayFileInput');
    const overlayScale = document.getElementById('overlayScale');
    const overlayX = document.getElementById('overlayX');
    const overlayY = document.getElementById('overlayY');
    
    // Other elements
    const uploadBtn = document.getElementById('uploadBtn');
    const imageName = document.getElementById('imageName');
    const imageText = document.getElementById('imageText');
    const fontSize = document.getElementById('fontSize');
    const textPadding = document.getElementById('textPadding');
    const verticalPosition = document.getElementById('verticalPosition');
    const recentImages = document.getElementById('recentImages');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');

    let mainFile = null;
    let overlayFile = null;
    let mainPreviewImage = null;
    let overlayPreviewImage = null;
    let originalMainDimensions = { width: 0, height: 0 };
    let originalOverlayDimensions = { width: 0, height: 0 };
    let currentSessionUploads = [];

    // Calculate preview font size based on image dimensions
    function calculatePreviewFontSize(actualFontSize) {
        if (!mainPreviewImage || !originalMainDimensions.width) return actualFontSize;
        const previewWidth = mainPreviewImage.width;
        const scaleFactor = previewWidth / originalMainDimensions.width;
        return Math.round(actualFontSize * scaleFactor);
    }

    // Update overlay image position and scale
    function updateOverlayPreview() {
        if (!overlayPreviewImage) return;

        const scale = overlayScale.value / 100;
        const x = overlayX.value;
        const y = overlayY.value;

        overlayPreviewImage.style.width = `${scale * 100}%`;
        overlayPreviewImage.style.left = `${x}%`;
        overlayPreviewImage.style.top = `${y}%`;
        overlayPreviewImage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    // Text overlay preview update
    function updatePreviewText() {
        const existingPreviewText = imagePreview.querySelector('.preview-text');
        if (existingPreviewText) {
            existingPreviewText.remove();
        }

        if (mainPreviewImage && imageText.value) {
            const previewText = document.createElement('div');
            previewText.className = 'preview-text';
            previewText.textContent = imageText.value;
            
            const scaledFontSize = calculatePreviewFontSize(parseInt(fontSize.value));
            previewText.style.fontSize = `${scaledFontSize}px`;
            
            previewText.style.top = `${verticalPosition.value}%`;
            previewText.style.transform = `translateX(-50%) translateY(-100%)`;
            previewText.style.paddingLeft = `${textPadding.value}%`;
            previewText.style.paddingRight = `${textPadding.value}%`;
            imagePreview.appendChild(previewText);
        }
    }

    // Update preview when controls change
    [imageText, fontSize, textPadding, verticalPosition].forEach(input => {
        input.addEventListener('input', updatePreviewText);
    });

    [overlayScale, overlayX, overlayY].forEach(input => {
        input.addEventListener('input', updateOverlayPreview);
    });

    // Modal handling
    closeModal.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    // Setup drag and drop for main image
    setupDragAndDrop(mainDropZone, mainFileInput, handleMainFileSelect);

    // Setup drag and drop for overlay image
    setupDragAndDrop(overlayDropZone, overlayFileInput, handleOverlayFileSelect);

    function setupDragAndDrop(dropZone, fileInput, handleFile) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    function handleMainFileSelect(file) {
        if (!file.type.startsWith('image/')) {
            showMessage('Please select an image file', 'error');
            return;
        }

        mainFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalMainDimensions = {
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };
                mainPreviewImage = img;
                imagePreview.innerHTML = '';
                imagePreview.appendChild(mainPreviewImage);
                if (overlayPreviewImage) {
                    imagePreview.appendChild(overlayPreviewImage);
                }
                updatePreviewText();
                updateOverlayPreview();
            };
            img.src = e.target.result;
            uploadBtn.disabled = false;
        };

        reader.readAsDataURL(file);
    }

    function handleOverlayFileSelect(file) {
        if (!file.type.startsWith('image/')) {
            showMessage('Please select an image file', 'error');
            return;
        }

        overlayFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalOverlayDimensions = {
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };
                if (overlayPreviewImage) {
                    overlayPreviewImage.remove();
                }
                overlayPreviewImage = img;
                overlayPreviewImage.className = 'preview-overlay';
                if (imagePreview.contains(mainPreviewImage)) {
                    imagePreview.appendChild(overlayPreviewImage);
                    updateOverlayPreview();
                }
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    // Monitor preview image size changes
    const resizeObserver = new ResizeObserver(() => {
        if (mainPreviewImage) {
            updatePreviewText();
            updateOverlayPreview();
        }
    });
    resizeObserver.observe(imagePreview);

    uploadBtn.addEventListener('click', async () => {
        if (!mainFile) {
            showMessage('Please select a main image first', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', mainFile);
        if (overlayFile) {
            formData.append('overlay', overlayFile);
            formData.append('overlayScale', overlayScale.value);
            formData.append('overlayX', overlayX.value);
            formData.append('overlayY', overlayY.value);
        }
        
        if (imageName.value) {
            formData.append('name', imageName.value);
        }
        
        if (imageText.value) {
            formData.append('text', imageText.value);
            formData.append('fontSize', fontSize.value);
            formData.append('textPadding', textPadding.value);
            formData.append('verticalPosition', verticalPosition.value);
        }

        try {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';

            const response = await fetch(`${process.env.SERVER_URL}/api/images`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Image uploaded successfully!', 'success');
                // Add to current session uploads
                currentSessionUploads.unshift({
                    url: data.url,
                    name: data.name,
                    uploadDate: new Date()
                });
                updateRecentUploads();
                resetForm();
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Image';
        }
    });

    async function loadRecentImages() {
        try {
            const response = await fetch(`${process.env.SERVER_URL}/api/images?view=recent&page=1&pageSize=8`);
            const data = await response.json();

            recentImages.innerHTML = '';
            data.images.forEach(image => {
                const imageCard = document.createElement('div');
                imageCard.className = 'gallery-card';
                
                const img = document.createElement('img');
                img.src = image.url.replace('/api/api/', '/api/');
                img.alt = image.name;
                img.loading = 'lazy';

                imageCard.appendChild(img);
                imageCard.addEventListener('click', () => {
                    modal.style.display = "block";
                    modalImg.src = image.url.replace('/api/api/', '/api/');
                    modalImg.dataset.imageName = image.name;
                });

                recentImages.appendChild(imageCard);
            });
        } catch (error) {
            console.error('Error loading recent images:', error);
        }
    }

    function updateRecentUploads() {
        recentImages.innerHTML = '';
        currentSessionUploads.forEach(image => {
            const imageCard = document.createElement('div');
            imageCard.className = 'gallery-card';
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.name;
            img.loading = 'lazy';

            imageCard.appendChild(img);
            imageCard.addEventListener('click', () => {
                modal.style.display = "block";
                modalImg.src = image.url;
                modalImg.dataset.imageName = image.name;
            });

            recentImages.appendChild(imageCard);
        });

        // Update section visibility
        const recentUploadsSection = document.querySelector('.recent-uploads');
        if (currentSessionUploads.length > 0) {
            recentUploadsSection.style.display = 'block';
        } else {
            recentUploadsSection.style.display = 'none';
        }
    }

    function showMessage(message, type) {
        const existingMessage = document.querySelector('.status-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `status-message ${type}`;
        messageElement.textContent = message;
        
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.insertBefore(messageElement, uploadSection.firstChild);

        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }

    function resetForm() {
        mainFile = null;
        overlayFile = null;
        mainPreviewImage = null;
        overlayPreviewImage = null;
        originalMainDimensions = { width: 0, height: 0 };
        originalOverlayDimensions = { width: 0, height: 0 };
        mainFileInput.value = '';
        overlayFileInput.value = '';
        imageName.value = '';
        imageText.value = '';
        imagePreview.innerHTML = '<p>No image selected</p>';
        uploadBtn.disabled = true;
        
        // Reset overlay controls
        overlayScale.value = 100;
        overlayX.value = 50;
        overlayY.value = 50;
    }

    // Initialize
    uploadBtn.disabled = true;
    loadRecentImages(); // Initialize recent uploads section
    updateRecentUploads(); // Initialize recent uploads section
});
