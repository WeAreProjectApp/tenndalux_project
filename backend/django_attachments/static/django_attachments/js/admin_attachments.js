(function() {
    function updateUrls(input, widget) {
        var value = input.value;
        if (value && value !== 'None') {
            var listUrl = input.getAttribute('data-list-url');
            var uploadUrl = input.getAttribute('data-upload-url');
            var updateUrl = input.getAttribute('data-update-url');
            if (listUrl !== null) {
                listUrl = listUrl.replace('__library_id__', value);
            }
            if (uploadUrl !== null) {
                uploadUrl = uploadUrl.replace('__library_id__', value);
            }
            if (updateUrl !== null) {
                updateUrl = updateUrl.replace('__library_id__', value);
            }
            widget.listUrl = listUrl;
            widget.uploadUrl = uploadUrl;
            widget.updateUrl = updateUrl;
        } else {
            widget.listUrl = input.getAttribute('data-list-url');
            widget.uploadUrl = input.getAttribute('data-upload-url');
            widget.updateUrl = input.getAttribute('data-update-url');
        }
        widget.createLibraryUrl = input.getAttribute('data-create-library-url');
    }

    document.addEventListener("DOMContentLoaded", function(event) {
        var inputs = Array.prototype.slice.call(document.getElementsByClassName('django-attachments-widget'));
        var widgets = [];
        inputs.forEach(function(input) {
            var w = uploadWidget(input, {autoProcess: false, maxFiles: 1});
            widgets.push(w);
            updateUrls(input, w);
            w.loadAttachments();
        });

        var mainContent = document.getElementById('content-main');
        var form = mainContent.getElementsByTagName('form')[0];

        function saveAllWidgets(widgets, inputs) {
            return Promise.all(widgets.map(function(w, i) {
                return new Promise((resolve, reject) => {
                    var input = inputs[i];

                    function saveAttachments() {
                        w.save(resolve, reject);
                    }

                    if (input.value && input.value !== 'None') {
                        saveAttachments();
                    } else {
                        w.createLibrary(function(value) {
                            if (value !== null) {
                                input.value = value;
                                updateUrls(input, w);
                                saveAttachments();
                            } else {
                                reject(new Error('Error creating library.'));
                            }
                        });
                    }
                });
            }));
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var previousError = form.querySelector('.attachments-save-error');
            if (previousError !== null) previousError.remove();
            var btn = e.submitter;
            if (btn !== null) {
                btn.disabled = true;
            }

            saveAllWidgets(widgets, inputs).then(() => {
                if (btn !== null) {
                    btn.disabled = false;
                }
                form.submit();
            }).catch((error) => {
                console.error('Error saving widgets:', error);
                var message = document.createElement('p');
                message.className = 'errornote attachments-save-error';
                message.setAttribute('role', 'alert');
                message.textContent = error.message;
                form.prepend(message);
                if (btn !== null) {
                    btn.disabled = false;
                }
            });
        }, true);
    });
}());
