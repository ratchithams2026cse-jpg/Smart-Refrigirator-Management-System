
// SMART FRIDGE - Food Management System

// Get HTML elements
const foodForm = document.getElementById("foodForm");
const foodList = document.getElementById("foodList");
const alerts = document.getElementById("alerts");
const foodImage = document.getElementById("foodImage");
const notificationBtn = document.getElementById("notificationBtn");

// Load saved food items from browser storage
let foods = [];

try {
    foods = JSON.parse(localStorage.getItem("smartFridgeFoods")) || [];
    if (!Array.isArray(foods)) foods = [];
} catch {
    foods = [];
}

// Save food items
function saveFoods() {
    localStorage.setItem("smartFridgeFoods", JSON.stringify(foods));
}

// B. IMAGE-SAVING FUNCTION
function readFoodImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image file."));
            return;
        }

        if (file.size > 1024 * 1024) {
            reject(new Error("Please choose an image smaller than 1 MB."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(
            new Error("Unable to read the image.")
        );

        reader.readAsDataURL(file);
    });
}
// Calculate days remaining until expiry
function getDaysLeft(date) {
    const [year, month, day] = date.split("-").map(Number);

    const expiry = new Date(year, month - 1, day);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.round((expiry - today) / 86400000);
}

// Find food status
function getStatus(date) {
    const days = getDaysLeft(date);

    if (days < 0) {
        return {
            name: "Expired",
            className: "expired"
        };
    }

    if (days <= 3) {
        return {
            name: days === 0 ? "Expires Today" : "Expiring Soon",
            className: "soon"
        };
    }

    return {
        name: "Fresh",
        className: "fresh"
    };
}

// Update dashboard numbers
function updateDashboard() {
    let fresh = 0;
    let soon = 0;
    let expired = 0;

    foods.forEach(food => {
        const status = getStatus(food.expiry);

        if (status.className === "fresh") fresh++;
        else if (status.className === "soon") soon++;
        else expired++;
    });

    document.getElementById("totalItems").textContent = foods.length;
    document.getElementById("freshItems").textContent = fresh;
    document.getElementById("expiringItems").textContent = soon;
    document.getElementById("expiredItems").textContent = expired;
}

// Display expiry warnings
function showAlerts() {
    alerts.replaceChildren();

    const urgentFoods = foods.filter(food =>
        getStatus(food.expiry).className !== "fresh"
    );

    urgentFoods.forEach(food => {
        const message = document.createElement("div");
        message.className = "alert-message";

        const status = getStatus(food.expiry).name;

        message.textContent = `⚠️ ${food.name}: ${status}!`;
        alerts.appendChild(message);
    });
}

// Display all food items
function displayFoods() {
    foodList.replaceChildren();

    if (foods.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";

        const icon = document.createElement("span");
        icon.textContent = "🧺";

        const heading = document.createElement("h3");
        heading.textContent = "Your fridge is empty!";

        const paragraph = document.createElement("p");
        paragraph.textContent = "Add your first food item to get started.";

        empty.append(icon, heading, paragraph);
        foodList.appendChild(empty);
    }

    foods.forEach(food => {
        const status = getStatus(food.expiry);
        const days = getDaysLeft(food.expiry);

        const card = document.createElement("div");
        card.className = "food-item";

        
        const details = document.createElement("div");
        details.className = "food-details";

        // Display food image
        const image = document.createElement("img");
        image.className = "food-image";
        image.alt = food.name;

        if (food.image) {
            image.src = food.image;
        } else {
            image.src = "https://placehold.co/100x100/172438/ffffff?text=Food";
        }

        // Display food information
        const text = document.createElement("div");
        text.className = "food-text";

        const name = document.createElement("h3");
        name.textContent = food.name;

        const information = document.createElement("p");
        information.textContent =
            `${food.category} | Quantity: ${food.quantity} | Expiry: ${food.expiry}`;

        const remaining = document.createElement("p");

        if (days < 0) {
            remaining.textContent =
                `Expired ${Math.abs(days)} day(s) ago`;
        } else if (days === 0) {
            remaining.textContent = "Expires today";
        } else {
            remaining.textContent =
                `${days} day(s) remaining`;
        }

        text.append(name, information, remaining);
        details.append(image, text);


        const actions = document.createElement("div");
        actions.className = "food-actions";

        const badge = document.createElement("span");
        badge.className = `badge ${status.className}`;
        badge.textContent = status.name;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteFood(food.id);
        });

        actions.append(badge, deleteButton);
        card.append(details, actions);

        foodList.appendChild(card);
    });

    updateDashboard();
    showAlerts();
}

// Add a new food item
foodForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = document.getElementById("foodName").value.trim();
    const category = document.getElementById("foodCategory").value;
    const quantity = Number(document.getElementById("foodQuantity").value);
    const expiry = document.getElementById("expiryDate").value;

    if (!name || !expiry || !Number.isInteger(quantity) ||
        quantity < 1 || quantity > 999) {
        alert("Please enter valid food details.");
        return;
    }

    
    let imageData = "";

    try {
        imageData = await readFoodImage(foodImage.files[0]);
    } catch (error) {
        alert(error.message);
        return;
    }

    const newFood = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        name: name,
        category: category,
        quantity: quantity,
        expiry: expiry,
        image: imageData
    };

    foods.push(newFood);

    try {
        saveFoods();
    } catch (error) {
        foods.pop();
        alert("Storage is full. Please use a smaller image.");
        return;
    }

    displayFoods();
    foodForm.reset();

    alert("Food item successfully added to Smart Fridge!");

});

// Delete a food item
function deleteFood(id) {
    foods = foods.filter(food => food.id !== id);

    saveFoods();
    displayFoods();
}

// Load saved items when the website opens
// Browser expiry notifications
notificationBtn.addEventListener("click", async function() {
    if (!("Notification" in window)) {
        alert("Your browser does not support notifications.");
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        alert("Expiry notifications enabled!");

        foods.forEach(food => {
            const days = getDaysLeft(food.expiry);

            if (days >= 0 && days <= 3) {
                new Notification("Smart Fridge Alert", {
                    body: `${food.name} expires in ${days} day(s)!`
                });
            }
        });
    } else {
        alert("Notification permission was not granted.");
    }
});

// Load saved items
displayFoods();
// Clear all food items
clearAllBtn.addEventListener("click", function() {
    if (confirm("Are you sure you want to delete all food items?")) {
        foods = [];
        saveFoods();
        displayFoods();
        alert("All food items cleared!");
    }
});
