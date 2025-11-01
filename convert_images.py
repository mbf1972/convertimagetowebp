import os
from PIL import Image
import io

# Dossier contenant les images à convertir
input_folder = 'mockups'
# Dossier où seront enregistrées les images converties
output_folder = 'mockups'

# Taille maximale souhaitée en octets (1 Mo)
MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024
# Dimension maximale pour le côté le plus long de l'image si redimensionnement nécessaire
MAX_DIMENSION = 1920

# Crée le dossier de sortie s'il n'existe pas
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Parcourt tous les fichiers dans le dossier d'entrée
for filename in os.listdir(input_folder):
    # Chemin complet de l'image d'entrée
    input_path = os.path.join(input_folder, filename)
    
    # Vérifie si le fichier est une image
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
        try:
            # Ouvre l'image avec Pillow
            with Image.open(input_path) as img:
                # Convertir en RGB si nécessaire (pour éviter les problèmes avec certains formats)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')

                original_img = img.copy() # Garder une copie pour le redimensionnement

                # Nom de base du fichier sans extension
                base_filename = os.path.splitext(filename)[0]
                # Chemin complet de l'image de sortie
                output_path = os.path.join(output_folder, base_filename + '.webp')
                
                current_img = original_img.copy()
                resized_happened = False

                while True:
                    webp_data = io.BytesIO()
                    quality = 95
                    
                    # Tente de compresser l'image avec une qualité décroissante
                    while quality >= 10:
                        webp_data = io.BytesIO()
                        current_img.save(webp_data, 'webp', quality=quality, optimize=True)
                        if webp_data.tell() <= MAX_FILE_SIZE_BYTES:
                            break
                        quality -= 5
                    
                    if webp_data.tell() <= MAX_FILE_SIZE_BYTES:
                        # Si la taille est bonne, sortir de la boucle de redimensionnement
                        break
                    elif not resized_happened and (current_img.width > MAX_DIMENSION or current_img.height > MAX_DIMENSION):
                        # Si la qualité minimale n'est pas suffisante et l'image est grande, redimensionner
                        print(f"Image '{filename}' trop grande même à faible qualité. Redimensionnement...")
                        width, height = current_img.size
                        if width > height:
                            new_width = MAX_DIMENSION
                            new_height = int(height * (new_width / width))
                        else:
                            new_height = MAX_DIMENSION
                            new_width = int(width * (new_height / height))
                        current_img = original_img.resize((new_width, new_height), Image.LANCZOS)
                        resized_happened = True
                    else:
                        # Si redimensionnement déjà fait ou image pas si grande et toujours > 1MB, on ne peut pas faire mieux
                        print(f"Impossible de réduire '{filename}' en dessous de 1 Mo sans perte significative de qualité/taille. Taille finale: {webp_data.tell() / (1024*1024):.2f} Mo")
                        break # Sortir de la boucle de redimensionnement

                # Écrit l'image compressée sur le disque
                with open(output_path, 'wb') as f:
                    f.write(webp_data.getvalue())
                
                print(f"'{filename}' a été converti en '{base_filename}.webp' avec une qualité de {quality} (taille: {webp_data.tell() / (1024*1024):.2f} Mo)")
        except Exception as e:
            print(f"Erreur lors de la conversion de '{filename}': {e}")
