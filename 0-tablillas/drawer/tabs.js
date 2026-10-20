jQuery(document).ready(function($) {

    // 1. CONTROL DE PESTAÑAS (Tabs)
    $(document).on('click', '.drawer-tab', function(e) {
        e.preventDefault();
        var targetTab = $(this).attr('data-tab');

        // Cambia la clase active en los botones
        $('.drawer-tab').removeClass('active');
        $(this).addClass('active');

        // Muestra el panel correspondiente
        $('.drawer-tab-pane').removeClass('active');
        $('#tab-' + targetTab).addClass('active');
    });

    // 2. ABRIR Y POBLAR EL DRAWER AL HACER CLIC EN UN POST
    $(document).on('click', '.open-shadow-drawer', function(e) {
        e.preventDefault();
        var postId = $(this).attr('data-post-id');
        var numericId = postId.replace('p', '');
        var $postContainer = $('#' + postId).closest('.post-bigwrap');
        var $profile = $('#profile' + numericId);

        // Heredar el color del grupo del post
        var groupStyle = $postContainer.attr('style');
        if (groupStyle) {
            $('#shadow-drawer').attr('style', groupStyle);
        }

        // Si existe el perfil oculto, inyectar los datos en tus IDs
        if ($profile.length > 0) {
            // Ejemplo de mapeo básico:
            $('#drawer-char-name').text($profile.find('.profile-name').text());
            
            // Si tienes los valores calculados/guardados:
            // $('#drawer-health').text(...);
            // $('#drawer-stamina').text(...);
            // $('#drawer-evasion').text(...);
        }

        // Mostrar el drawer (si no lo tienes fijo con right: 0)
        $('#shadow-drawer').addClass('active');
        $('#shadow-overlay').addClass('active');
    });

    // 3. CERRAR EL DRAWER
    $(document).on('click', '#close-shadow-drawer, #shadow-overlay', function(e) {
        e.preventDefault();
        $('#shadow-drawer').removeClass('active');
        $('#shadow-overlay').removeClass('active');
    });
});