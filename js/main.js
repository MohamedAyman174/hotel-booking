const rooms = [
    { id: "royal-suite", name: "Royal Skyline Suite", category: "luxury", categoryLabel: "Luxury Hotels", price: 420 },
    { id: "executive-grand", name: "Executive Grand Room", category: "luxury", categoryLabel: "Luxury Hotels", price: 310 },
    { id: "signature-penthouse", name: "Signature Penthouse", category: "luxury", categoryLabel: "Luxury Hotels", price: 520 },
    { id: "business-focus", name: "Business Focus Room", category: "business", categoryLabel: "Business Hotels", price: 190 },
    { id: "executive-work", name: "Executive Work Suite", category: "business", categoryLabel: "Business Hotels", price: 240 },
    { id: "family-comfort", name: "Family Comfort Suite", category: "family", categoryLabel: "Family Hotels", price: 260 },
    { id: "connected-family", name: "Connected Family Rooms", category: "family", categoryLabel: "Family Hotels", price: 300 },
    { id: "junior-family-loft", name: "Junior Family Loft", category: "family", categoryLabel: "Family Hotels", price: 220 },
    { id: "smart-essential", name: "Smart Essential Room", category: "budget", categoryLabel: "Budget Hotels", price: 95 },
    { id: "urban-saver", name: "Urban Saver Room", category: "budget", categoryLabel: "Budget Hotels", price: 80 },
    { id: "compact-plus", name: "Compact Plus Room", category: "budget", categoryLabel: "Budget Hotels", price: 115 },
    { id: "ocean-breeze", name: "Ocean Breeze Villa", category: "beach", categoryLabel: "Beach Resorts", price: 350 },
    { id: "lagoon-terrace", name: "Lagoon Terrace Room", category: "beach", categoryLabel: "Beach Resorts", price: 285 },
    { id: "sunset-resort", name: "Sunset Resort Suite", category: "beach", categoryLabel: "Beach Resorts", price: 390 }
];

const STORAGE_KEYS = {
    selectedRoom: "selectedRoom",
    draftBooking: "lumaStayDraftBooking",
    completedBooking: "lumaStayCompletedBooking"
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
});

document.addEventListener("DOMContentLoaded", () => {
    setActiveNavigation();
    initMobileNavigation();
    initRoomFilters();
    storeReservationLinks();
    initReservationForm();
    initCheckoutPage();
    initSuccessPage();
    initContactForm();
    initNewsletterForm();
});

function getRoomById(roomId) {
    return rooms.find((room) => room.id === roomId) || null;
}

function formatCurrency(amount) {
    return currencyFormatter.format(Number(amount) || 0);
}

function getSelectedBookingData(key = STORAGE_KEYS.draftBooking) {
    try {
        return JSON.parse(localStorage.getItem(key)) || null;
    } catch (error) {
        return null;
    }
}

function saveBookingData(booking, key = STORAGE_KEYS.draftBooking) {
    localStorage.setItem(key, JSON.stringify(booking));
}

function calculateNights(checkInValue, checkOutValue) {
    if (!checkInValue || !checkOutValue) {
        return 0;
    }

    const checkInDate = new Date(checkInValue + "T00:00:00");
    const checkOutDate = new Date(checkOutValue + "T00:00:00");
    const difference = checkOutDate - checkInDate;

    return Math.floor(difference / 86400000);
}

function calculateTotalPrice(pricePerNight, nights) {
    return nights > 0 ? Number(pricePerNight) * nights : 0;
}

function generateBookingReference() {
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    const datePart = Date.now().toString().slice(-5);
    return "LS-" + datePart + "-" + randomPart;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function setActiveNavigation() {
    const page = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
        if (link.dataset.nav === page) {
            link.classList.add("active");
        }
    });
}

function initMobileNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");

    if (!toggle || !links) {
        return;
    }

    toggle.addEventListener("click", () => {
        const isOpen = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });
}

function initRoomFilters() {
    const chips = document.querySelectorAll(".filter-chip");
    const cards = document.querySelectorAll(".room-card");
    const searchInput = document.getElementById("roomSearch");
    const validFilters = ["all", ...new Set(rooms.map((room) => room.category))];

    if (!chips.length || !cards.length) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedFilter = params.get("category") || "all";
    const initialFilter = validFilters.includes(requestedFilter) ? requestedFilter : "all";

    applyRoomFilter(initialFilter, chips, cards, searchInput ? searchInput.value : "");

    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            applyRoomFilter(chip.dataset.filter, chips, cards, searchInput ? searchInput.value : "");
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const activeChip = document.querySelector(".filter-chip.active");
            applyRoomFilter(activeChip ? activeChip.dataset.filter : "all", chips, cards, searchInput.value);
        });
    }
}

function applyRoomFilter(filter, chips, cards, searchTerm = "") {
    const emptyState = document.getElementById("roomEmptyState");
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let visibleCount = 0;

    chips.forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.filter === filter);
    });

    cards.forEach((card) => {
        const matchesCategory = filter === "all" || card.dataset.category === filter;
        const matchesSearch = !normalizedSearch || card.textContent.toLowerCase().includes(normalizedSearch);
        const shouldShow = matchesCategory && matchesSearch;
        card.classList.toggle("is-hidden", !shouldShow);

        if (shouldShow) {
            visibleCount += 1;
        }
    });

    if (emptyState) {
        emptyState.classList.toggle("show", visibleCount === 0);
    }
}

function storeReservationLinks() {
    document.querySelectorAll(".reserve-link").forEach((link) => {
        link.addEventListener("click", () => {
            const roomId = new URL(link.href).searchParams.get("room");
            if (roomId) {
                localStorage.setItem(STORAGE_KEYS.selectedRoom, roomId);
            }
        });
    });
}

function initReservationForm() {
    const form = document.getElementById("reservationForm");

    if (!form) {
        return;
    }

    const categorySelect = document.getElementById("hotelCategory");
    const roomSelect = document.getElementById("roomType");
    const checkIn = document.getElementById("checkIn");
    const checkOut = document.getElementById("checkOut");
    const guests = document.getElementById("guests");
    const message = document.getElementById("reservationMessage");

    setMinimumDates(checkIn, checkOut);
    populateRooms(roomSelect, categorySelect.value);
    prefillReservationFromStorage(form, categorySelect, roomSelect);
    preselectRoomFromState(categorySelect, roomSelect);
    updateReservationSummary();

    categorySelect.addEventListener("change", () => {
        populateRooms(roomSelect, categorySelect.value);
        updateReservationSummary();
    });

    roomSelect.addEventListener("change", () => {
        syncCategoryWithRoom(categorySelect, roomSelect);
        updateReservationSummary();
    });

    [checkIn, checkOut, guests].forEach((field) => {
        field.addEventListener("input", updateReservationSummary);
        field.addEventListener("change", updateReservationSummary);
    });

    checkIn.addEventListener("change", () => {
        if (checkIn.value) {
            checkOut.min = addDays(checkIn.value, 1);
            if (checkOut.value && calculateNights(checkIn.value, checkOut.value) <= 0) {
                checkOut.value = "";
            }
        }
        updateReservationSummary();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        message.classList.remove("success");

        const validation = validateReservation(form, checkIn.value, checkOut.value);
        if (!validation.valid) {
            message.textContent = validation.message;
            return;
        }

        const booking = createBookingFromForm(form);
        saveBookingData(booking);
        localStorage.setItem(STORAGE_KEYS.selectedRoom, booking.roomId);
        window.location.href = "checkout.html";
    });
}

function populateRooms(roomSelect, category) {
    const availableRooms = category ? rooms.filter((room) => room.category === category) : rooms;

    roomSelect.innerHTML = '<option value="">Select room</option>';
    availableRooms.forEach((room) => {
        const option = document.createElement("option");
        option.value = room.id;
        option.textContent = room.name + " - " + formatCurrency(room.price) + " / night";
        roomSelect.appendChild(option);
    });
}

function prefillReservationFromStorage(form, categorySelect, roomSelect) {
    const booking = getSelectedBookingData();

    if (!booking) {
        return;
    }

    const selectedRoom = getRoomById(booking.roomId);
    form.fullName.value = booking.customer ? booking.customer.fullName || "" : "";
    form.email.value = booking.customer ? booking.customer.email || "" : "";
    form.phone.value = booking.customer ? booking.customer.phone || "" : "";
    form.checkIn.value = booking.checkIn || "";
    form.checkOut.value = booking.checkOut || "";
    form.guests.value = booking.guests || "1";

    if (selectedRoom) {
        categorySelect.value = selectedRoom.category;
        populateRooms(roomSelect, selectedRoom.category);
        roomSelect.value = selectedRoom.id;
    }
}

function preselectRoomFromState(categorySelect, roomSelect) {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room") || localStorage.getItem(STORAGE_KEYS.selectedRoom);
    const selectedRoom = getRoomById(roomId);

    if (!selectedRoom) {
        return;
    }

    categorySelect.value = selectedRoom.category;
    populateRooms(roomSelect, selectedRoom.category);
    roomSelect.value = selectedRoom.id;
}

function syncCategoryWithRoom(categorySelect, roomSelect) {
    const selectedRoom = getRoomById(roomSelect.value);

    if (!selectedRoom || categorySelect.value === selectedRoom.category) {
        return;
    }

    categorySelect.value = selectedRoom.category;
    populateRooms(roomSelect, selectedRoom.category);
    roomSelect.value = selectedRoom.id;
}

function setMinimumDates(checkIn, checkOut) {
    const today = new Date();
    const todayString = toDateInputValue(today);
    checkIn.min = todayString;
    checkOut.min = addDays(todayString, 1);
}

function updateReservationSummary() {
    const roomSelect = document.getElementById("roomType");
    const checkIn = document.getElementById("checkIn");
    const checkOut = document.getElementById("checkOut");
    const guests = document.getElementById("guests");

    if (!roomSelect || !checkIn || !checkOut || !guests) {
        return;
    }

    const selectedRoom = getRoomById(roomSelect.value);
    const nights = calculateNights(checkIn.value, checkOut.value);
    const price = selectedRoom ? selectedRoom.price : 0;
    const total = calculateTotalPrice(price, nights);

    setText("summaryRoom", selectedRoom ? selectedRoom.name : "Select a room");
    setText("summaryRate", formatCurrency(price));
    setText("summaryNights", String(Math.max(nights, 0)));
    setText("summaryGuests", guests.value || "1");
    setText("summaryTotal", formatCurrency(total));
}

function createBookingFromForm(form) {
    const selectedRoom = getRoomById(form.roomType.value);
    const nights = calculateNights(form.checkIn.value, form.checkOut.value);
    const pricePerNight = selectedRoom ? selectedRoom.price : 0;

    return {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        category: selectedRoom.category,
        categoryLabel: selectedRoom.categoryLabel,
        checkIn: form.checkIn.value,
        checkOut: form.checkOut.value,
        nights,
        guests: Number(form.guests.value),
        pricePerNight,
        totalPrice: calculateTotalPrice(pricePerNight, nights),
        customer: {
            fullName: form.fullName.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim()
        }
    };
}

function validateReservation(form, checkInValue, checkOutValue) {
    if (!form.checkValidity()) {
        return { valid: false, message: "Please complete all required fields with valid information." };
    }

    if (!getRoomById(form.roomType.value)) {
        return { valid: false, message: "Please select a valid room type." };
    }

    const nights = calculateNights(checkInValue, checkOutValue);
    if (nights <= 0) {
        return { valid: false, message: "Check-out date must be after the check-in date." };
    }

    return { valid: true, message: "" };
}

function initCheckoutPage() {
    const checkoutContent = document.getElementById("checkoutContent");

    if (!checkoutContent) {
        return;
    }

    const booking = getSelectedBookingData();
    const fallback = document.getElementById("checkoutFallback");
    const form = document.getElementById("checkoutForm");

    if (!booking || !getRoomById(booking.roomId)) {
        checkoutContent.hidden = true;
        if (fallback) {
            fallback.hidden = false;
        }
        return;
    }

    renderCheckoutSummary(booking);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const completedBooking = {
            ...booking,
            paymentMethod: formData.get("paymentMethod") || "Credit/Debit Card",
            bookingReference: generateBookingReference(),
            completedAt: new Date().toISOString()
        };

        saveBookingData(completedBooking, STORAGE_KEYS.completedBooking);
        localStorage.removeItem(STORAGE_KEYS.draftBooking);
        window.location.href = "booking-success.html";
    });
}

function renderCheckoutSummary(booking) {
    setText("checkoutRoom", booking.roomName);
    setText("checkoutCategory", booking.categoryLabel);
    setText("checkoutCheckIn", booking.checkIn);
    setText("checkoutCheckOut", booking.checkOut);
    setText("checkoutNights", String(booking.nights));
    setText("checkoutGuests", String(booking.guests));
    setText("checkoutRate", formatCurrency(booking.pricePerNight));
    setText("checkoutTotal", formatCurrency(booking.totalPrice));
    setText("checkoutName", booking.customer.fullName);
    setText("checkoutEmail", booking.customer.email);
    setText("checkoutPhone", booking.customer.phone);
}

function initSuccessPage() {
    const successContent = document.getElementById("successContent");

    if (!successContent) {
        return;
    }

    const booking = getSelectedBookingData(STORAGE_KEYS.completedBooking);
    const fallback = document.getElementById("successFallback");

    if (!booking) {
        successContent.hidden = true;
        if (fallback) {
            fallback.hidden = false;
        }
        return;
    }

    setText("successReference", booking.bookingReference || generateBookingReference());
    setText("successRoom", booking.roomName);
    setText("successCategory", booking.categoryLabel);
    setText("successDates", booking.checkIn + " to " + booking.checkOut);
    setText("successNights", String(booking.nights));
    setText("successGuests", String(booking.guests));
    setText("successPayment", booking.paymentMethod || "Credit/Debit Card");
    setText("successTotal", formatCurrency(booking.totalPrice));
}

function addDays(dateValue, days) {
    const date = new Date(dateValue + "T00:00:00");
    date.setDate(date.getDate() + days);
    return toDateInputValue(date);
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function initContactForm() {
    const form = document.getElementById("contactForm");

    if (!form) {
        return;
    }

    const status = document.getElementById("contactStatus");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        status.classList.remove("success");

        if (!form.checkValidity()) {
            status.textContent = "Please fill in your name, email, and message.";
            return;
        }

        status.textContent = "Thank you. Your message has been prepared successfully.";
        status.classList.add("success");
        form.reset();
    });
}

function initNewsletterForm() {
    const form = document.getElementById("newsletterForm");

    if (!form) {
        return;
    }

    const status = document.getElementById("newsletterStatus");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        status.classList.remove("success");

        if (!form.checkValidity()) {
            status.textContent = "Please enter a valid email address.";
            return;
        }

        status.textContent = "Subscribed successfully. We will send future hotel offers to this email.";
        status.classList.add("success");
        form.reset();
    });
}
