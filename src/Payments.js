function validateForm() {
    const cardNumber = document.getElementById('card-number').value;
    const expiryDate = document.getElementById('expiry-date').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholder-name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;

    if (cardNumber.length !== 16 || isNaN(cardNumber)) {
        alert('Please enter a valid card number (16 digits).');
        return;
    }

    if (!expiryDate.match(/^\d{2}\/\d{4}$/)) {
        alert('Please enter a valid expiry date (MM/YYYY format).');
        return;
    }

    if (cvv.length !== 3 || isNaN(cvv)) {
        alert('Please enter a valid CVV (3 digits).');
        return;
    }

    if (!email.match(/^\S+@\S+\.\S+$/)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (address.length < 5) {
        alert('Please enter a valid address (at least 5 characters).');
        return;
    }

    document.getElementById('payment-form').submit();
}
