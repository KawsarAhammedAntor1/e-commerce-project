document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop actual submission for now

            // Basic validation (optional, as HTML 'required' handles empty fields)
            const name = document.getElementById('name').value;
            const message = document.getElementById('message').value;

            if (name && message) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Thanks, your message sent successfully.',
                    confirmButtonColor: '#28a745', // Green to match theme
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Start fresh
                    contactForm.reset();
                });
            }
        });
    }
});
