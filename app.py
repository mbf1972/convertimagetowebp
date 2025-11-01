from flask import Flask, request, send_file, Response
import os
from PIL import Image
import io

app = Flask(__name__)

@app.route('/')
def index():
    with open('index.html', 'r') as f:
        return f.read()

@app.route('/style.css')
def style_css():
    with open('style.css', 'r') as f:
        return Response(f.read(), mimetype='text/css')

@app.route('/script.js')
def script_js():
    with open('script.js', 'r') as f:
        return Response(f.read(), mimetype='application/javascript')
@app.route('/mockups/<path:filename>')
def serve_mockup(filename):
    return send_file(os.path.join('mockups', filename))


@app.route('/convert', methods=['POST'])
def convert_image():
    if 'image' not in request.files:
        return "No image part in the request", 400
    
    file = request.files['image']
    
    if file.filename == '':
        return "No selected file", 400
    
    if file:
        try:
            # Read the image into a BytesIO object
            img_bytes = io.BytesIO(file.read())
            img = Image.open(img_bytes)

            # Resize the image if its width is greater than 1920px
            max_width = 1920
            if img.width > max_width:
                height = int((max_width / img.width) * img.height)
                img = img.resize((max_width, height), Image.LANCZOS)

            # Create a BytesIO object to save the webp image
            output_bytes = io.BytesIO()
            img.save(output_bytes, 'webp', optimize=True, quality=70)
            output_bytes.seek(0) # Go to the beginning of the BytesIO object
            
            return send_file(output_bytes, mimetype='image/webp', as_attachment=True, download_name='converted.webp')
        except Exception as e:
            return f"Error converting image: {e}", 500

if __name__ == '__main__':
    app.run(debug=True)