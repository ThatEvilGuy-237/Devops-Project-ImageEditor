document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const viewRecentBtn = document.getElementById('viewRecentBtn');
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
        viewRecentBtn.classList.remove('active');
        currentView = 'all';
        currentPage = 1;
        loadImages(true);
    });

    viewRecentBtn.addEventListener('click', () => {
        viewRecentBtn.classList.add('active');
        viewAllBtn.classList.remove('active');
        currentView = 'recent';
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
                const response = await fetch(`http://localhost:3000/api/images/${imageName}`, {
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

            const response = await fetch(`http://localhost:3000/api/images?${params}`);
            const data = await response.json();

            if (clear) {
                galleryGrid.innerHTML = '';
            }

            data.images.forEach(image => {
                const imageCard = createImageCard(image);
                galleryGrid.appendChild(imageCard);
            });

            loadMoreBtn.style.display = data.hasMore ? 'block' : 'none';
        } catch (error) {
            console.error('Error loading images:', error);
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
            modal.style.display = "block";
            modalImg.src = image.url;
            modalImg.dataset.imageName = image.name;
            imageDetails.textContent = `Name: ${image.name}
            Uploaded: ${new Date(image.uploadDate).toLocaleString()}`;
        });

        return card;
    }
});
