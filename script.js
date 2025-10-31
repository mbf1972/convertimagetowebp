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

document.getElementById('convertButton').addEventListener('click', () => {
    const imageInput = document.getElementById('imageInput');

    if (imageInput.files.length === 0) {
        resultP.textContent = 'Please select an image.';
        resultP.style.color = 'red';
        return;
    }

    const file = imageInput.files[0];

    resultP.textContent = 'Converting...';
    resultP.style.color = 'black';
    downloadButton.disabled = true;
    imageResult.style.display = 'none';

    // Client-side conversion using Canvas API
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
        // Resize if necessary
        const maxWidth = 1920;
        let { width, height } = img;

        if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and convert to WebP
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
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
        }, 'image/webp', 0.7); // quality 70%
    };

    img.onerror = () => {
        resultP.textContent = 'Error loading image.';
        resultP.style.color = 'red';
        downloadButton.disabled = true;
        imageResult.style.display = 'none';
    };

    // Load the image from the file
    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Add error handling for canvas.toBlob
    canvas.toBlob = canvas.toBlob || function(callback, type, quality) {
        // Fallback for browsers that don't support toBlob
        const dataURL = canvas.toDataURL(type || 'image/webp', quality || 0.7);
        const byteString = atob(dataURL.split(',')[1]);
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        callback(new Blob([ab], {type: mimeString}));
    };
});