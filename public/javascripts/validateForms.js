// Example starter JavaScript for disabling form submissions if there are invalid fields - note that this only works for client side submissions i.e. through the form on the web page, however an invalid form could still be submitted e.g. through Postman, which is why we need back-end error handling as well (we use the validateReview function)
(function () {
    'use strict'

    //The command below is used along with its CDN (see script in boilerplate) to allow us to easily show the file names in our bootstrap image upload form
    bsCustomFileInput.init();

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // create any array of form elements and loop over them
    Array.from(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false)
        })
    })()