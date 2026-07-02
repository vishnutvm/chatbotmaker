// Simple test script to verify theme toggle functionality
// Run this in the browser console

console.log("=== Theme Toggle Test ===");

// Check if theme provider is loaded
const html = document.documentElement;
console.log("Current theme class:", html.className);

// Check localStorage
const storedTheme = localStorage.getItem('chatbot-theme');
console.log("Stored theme:", storedTheme || "none (will use default: dark)");

// Find theme toggle button
const themeButton = document.querySelector('button[aria-label*="Switch theme"]');
if (themeButton) {
    console.log("✅ Theme toggle button found");
    console.log("Button text:", themeButton.textContent.trim());
} else {
    console.log("❌ Theme toggle button NOT found");
}

// Test theme switching
if (themeButton) {
    console.log("\n=== Testing Theme Switch ===");

    // Click the button
    themeButton.click();

    setTimeout(() => {
        console.log("After click - HTML class:", document.documentElement.className);
        console.log("After click - localStorage:", localStorage.getItem('chatbot-theme'));
        console.log("After click - Button text:", themeButton.textContent.trim());
    }, 500);
}
