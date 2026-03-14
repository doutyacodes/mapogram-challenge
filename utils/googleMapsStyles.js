// utils/googleMapsStyles.js (or inline in your file)
export const applyGoogleMapsControlStyle = () => {
  if (!document.getElementById("gm-custom-style")) {
    const style = document.createElement("style");
    style.id = "gm-custom-style";
    style.textContent = `
      .gm-style .gm-bundled-control {
        margin-bottom: 130px !important;
      }
    `;
    document.head.appendChild(style);
  }
};
