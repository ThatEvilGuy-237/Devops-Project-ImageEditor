document.addEventListener('DOMContentLoaded', () => {
    // API base URL
    const API_URL = 'http://localhost:3000';

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const galleryGrid = document.getElementById('galleryGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const imageDetails = document.getElementById('imageDetails');
    const deleteImageBtn = document.getElementById('deleteImageBtn');
    const closeModal = document.querySelector('.close-modal');

    let currentPage = 1;
    let currentView = 'all';
    let currentSearch = '';
    const PAGE_SIZE = 12;

    // Load initial images
    loadImages();

    // Event listeners
    searchBtn.addEventListener('click', () => {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        loadImages(true);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            loadImages(true);
        }
    });

    viewAllBtn.addEventListener('click', () => {
        viewAllBtn.classList.add('active');
        currentView = 'all';
        currentPage = 1;
        loadImages(true);
    });

    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadImages(false);
    });

    closeModal.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    deleteImageBtn.addEventListener('click', async () => {
        const imageName = modalImg.dataset.imageName;
        if (!imageName) return;

        if (confirm('Are you sure you want to delete this image?')) {
            try {
                const response = await fetch(`${API_URL}/api/images/${imageName}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    modal.style.display = "none";
                    loadImages(true);
                } else {
                    alert('Failed to delete image');
                }
            } catch (error) {
                console.error('Error deleting image:', error);
                alert('Error deleting image');
            }
        }
    });

    function formatDetails(image) {
        console.log('Formatting details for image:', JSON.stringify(image, null, 2));
        // Basic details
        const imageDetails = document.getElementById('imageDetails');
        imageDetails.innerHTML = `
            <table>
                <tr><td>Name:</td><td>${image.name}</td></tr>
                <tr><td>Uploaded:</td><td>${new Date(image.uploadDate).toLocaleString()}</td></tr>
            </table>
        `;

        // Settings
        if (image.settings) {
            const dimensionsContent = document.querySelector('.dimensions-settings .settings-content');
            const overlayContent = document.querySelector('.overlay-settings .settings-content');
            const textContent = document.querySelector('.text-settings .settings-content');

            // Clear previous content
            dimensionsContent.innerHTML = '';
            overlayContent.innerHTML = '';
            textContent.innerHTML = '';

            // Dimensions
            if (image.settings.dimensions) {
                dimensionsContent.innerHTML = `
                    <table>
                        <tr><td>Width:</td><td>${image.settings.dimensions.width}px</td></tr>
                        <tr><td>Height:</td><td>${image.settings.dimensions.height}px</td></tr>
                    </table>
                `;
            }

            // Overlay
            if (image.settings.overlay) {
                overlayContent.innerHTML = `
                    <table>
                        <tr><td>Scale:</td><td>${image.settings.overlay.scale * 100}%</td></tr>
                        <tr><td>Position X:</td><td>${image.settings.overlay.position.x}%</td></tr>
                        <tr><td>Position Y:</td><td>${image.settings.overlay.position.y}%</td></tr>
                    </table>
                `;
            }

            // Text
            if (image.settings.text) {
                textContent.innerHTML = `
                    <table>
                        <tr><td>Content:</td><td>"${image.settings.text.content}"</td></tr>
                        <tr><td>Font Size:</td><td>${image.settings.text.fontSize}px</td></tr>
                        <tr><td>Padding:</td><td>${image.settings.text.padding}%</td></tr>
                        <tr><td>Position:</td><td>${image.settings.text.position}%</td></tr>
                    </table>
                `;
            }

            // Show/hide settings groups based on content
            document.querySelector('.dimensions-settings').style.display = 
                image.settings.dimensions ? 'block' : 'none';
            document.querySelector('.overlay-settings').style.display = 
                image.settings.overlay ? 'block' : 'none';
            document.querySelector('.text-settings').style.display = 
                image.settings.text ? 'block' : 'none';
        }
    }

    async function loadImages(clear = false) {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                pageSize: PAGE_SIZE,
                view: currentView
            });

            if (currentSearch) {
                params.append('search', currentSearch);
            }

            const response = await fetch(`${API_URL}/api/images?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Received data from API:', JSON.stringify(data, null, 2));

            if (clear) {
                galleryGrid.innerHTML = '';
            }

            if (data && data.images) {
                data.images.forEach(image => {
                    console.log('Processing image:', JSON.stringify(image, null, 2));
                    const imageCard = createImageCard(image);
                    galleryGrid.appendChild(imageCard);
                });

                loadMoreBtn.style.display = data.hasMore ? 'block' : 'none';
            } else {
                console.error('Invalid data format:', data);
                loadMoreBtn.style.display = 'none';
                if (clear) {
                    galleryGrid.innerHTML = '<div class="error-message">No images found.</div>';
                }
            }
        } catch (error) {
            console.error('Error loading images:', error);
            loadMoreBtn.style.display = 'none';
            if (clear) {
                galleryGrid.innerHTML = '<div class="error-message">Error loading images. Please try again later.</div>';
            }
        }
    }

    function createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'gallery-card';

        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.name;
        img.loading = 'lazy';

        const details = document.createElement('div');
        details.className = 'image-card-details';
        details.textContent = image.name;

        card.appendChild(img);
        card.appendChild(details);

        card.addEventListener('click', () => {
            console.log('Displaying image details:', JSON.stringify(image, null, 2));
            modal.style.display = "block";
            modalImg.src = image.url;
            modalImg.dataset.imageName = image.name;
            formatDetails(image);
        });

        return card;
    }
});
