import os
import re
import json

def get_html_images(html_content):
    return re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html_content)

def get_json_images(json_content):
    return re.findall(r'["\']([^"\']+\.(?:png|jpg|jpeg|gif|svg|webp))["\']', json_content, re.IGNORECASE)

web_dir = '/home/sbs/Documents/ADIP/web'
missing = []

for root, dirs, files in os.walk(web_dir):
    if 'node_modules' in root.split(os.sep):
        continue
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                images = get_html_images(content)
                for img in images:
                    if img.startswith('http') or img.startswith('data:'):
                        continue
                    
                    if img.startswith('/'):
                        img_path = os.path.join(web_dir, img.lstrip('/'))
                    else:
                        img_path = os.path.join(root, img)
                    
                    # Also try URL decoding the src, e.g. T&amp;S_m.jpg
                    from urllib.parse import unquote
                    import html
                    img_decoded = unquote(html.unescape(img))
                    img_path_decoded = os.path.join(root, img_decoded)
                    
                    if not os.path.exists(img_path) and not os.path.exists(img_path_decoded):
                        missing.append({'file': filepath, 'image_src': img, 'resolved': img_path})
        
        elif f.endswith('.json'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                images = get_json_images(content)
                for img in images:
                    if img.startswith('http') or img.startswith('data:'):
                        continue
                    
                    if img.startswith('/'):
                        img_path = os.path.join(web_dir, img.lstrip('/'))
                        if not os.path.exists(img_path):
                            missing.append({'file': filepath, 'image_src': img, 'resolved': img_path})
                    else:
                        img_path1 = os.path.join(root, img)
                        img_path2 = os.path.join(web_dir, img)
                        
                        if not os.path.exists(img_path1) and not os.path.exists(img_path2):
                            missing.append({'file': filepath, 'image_src': img, 'resolved': img_path1})

if missing:
    for m in missing:
        print(f"File: {os.path.relpath(m['file'], web_dir)} | Missing image: {m['image_src']}")
else:
    print("No missing images found.")
