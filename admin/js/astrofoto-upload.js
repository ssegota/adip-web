const imageUpload = document.querySelector("#image-upload");
const uploadedImagesList = document.querySelector("#image-list");
const imagePreviewDiv = document.querySelector("#manipulate-images");

function displayUploadedImage(fileName) {
  const listItem = document.createElement("li");
  listItem.textContent = fileName;
  uploadedImagesList?.appendChild(listItem);
}

function generatePreviewImages(event, image) {
  const reader = event.target;
  const previewImage = document.createElement("img");
  previewImage.className = "preview-image";

  previewImage.src = URL.createObjectURL(reader.files[0]);

  previewImage.onload = function () {
    URL.revokeObjectURL(previewImage.src);
  };
}

imageUpload?.addEventListener("change", () => {
  uploadedImagesList?.replaceChildren();
  const imageList = imageUpload.files;
  for (let i = 0; i < imageList.length; i++) {
    const uploadedImage = imageList[i];
    const uploadedImageName = uploadedImage.name;
    displayUploadedImage(uploadedImageName);
  }
});
