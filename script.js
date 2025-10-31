// Variables to store object URLs for proper cleanup
let currentPreviewUrl = null;
let currentResultUrl = null;

// Get references to elements
const resultP = document.querySelector('#result p');
const imageResult = document.getElementById('imageresult');
const downloadButton = document.getElementById('downloadButton');

// Initially disable download button
downloadButton.disabled = true;

// Add click event listener to download button
downloadButton.addEventListener('click', () => {
    if (currentResultUrl) {
        const a = document.createElement('a');
        a.href = currentResultUrl;
        a.download = 'converted.webp';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

document.getElementById('fileButton').addEventListener('click', () => {
    document.getElementById('imageInput').click();
});

document.getElementById('imageInput').addEventListener('change', (event) => {
    const [file] = event.target.files;
    const fileNameSpan = document.getElementById('fileName');
    if (file) {
        fileNameSpan.textContent = file.name;
        const imagePreview = document.getElementById('imagePreview');

        // Revoke previous preview URL to prevent memory leaks
        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
        }

        currentPreviewUrl = URL.createObjectURL(file);
        imagePreview.src = currentPreviewUrl;
        imagePreview.style.display = 'block';

        // Client-side file size check
        const maxSize = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSize) {
            if (!confirm("The selected image is larger than 10 MB. Conversion may take time or fail. Do you want to continue?")) {
                event.target.value = ''; // Clear the file input
                imagePreview.style.display = 'none';
                fileNameSpan.textContent = 'No file chosen';
                // Revoke the URL since we're clearing
                if (currentPreviewUrl) {
                    URL.revokeObjectURL(currentPreviewUrl);
                    currentPreviewUrl = null;
                }
                return;
            }
        }
    } else {
        fileNameSpan.textContent = 'No file chosen';
        // If no file selected, hide preview and revoke URL
        imagePreview.style.display = 'none';
        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = null;
        }
    }
});

document.getElementById('convertButton').addEventListener('click', async () => {
    const imageInput = document.getElementById('imageInput');

    if (imageInput.files.length === 0) {
        resultP.textContent = 'Please select an image.';
        resultP.style.color = 'red';
        return;
    }

    const file = imageInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

    resultP.textContent = 'Converting...';
    resultP.style.color = 'black';
    downloadButton.disabled = true;
    imageResult.style.display = 'none';

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Update the result paragraph with success message
            resultP.textContent = 'Conversion successful! The image has been converted to WebP format.';
            resultP.style.color = 'green';

            // Show the converted image
            imageResult.src = url;
            imageResult.style.display = 'block';

            // Enable download button and set its href
            downloadButton.href = url;
            downloadButton.download = 'converted.webp';
            downloadButton.disabled = false;

            // Store the result URL for cleanup
            if (currentResultUrl) {
                URL.revokeObjectURL(currentResultUrl);
            }
            currentResultUrl = url;
        } else {
            const errorText = await response.text();
            resultP.textContent = `Conversion error: ${errorText}`;
            resultP.style.color = 'red';
            downloadButton.disabled = true;
            imageResult.style.display = 'none';
        }
    } catch (error) {
        resultP.textContent = 'Network error: ' + error.message;
        resultP.style.color = 'red';
        console.error('Erreur:', error);
        downloadButton.disabled = true;
        imageResult.style.display = 'none';
    }
});