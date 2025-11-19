        // --- CONFIGURATION ---
        // Set the date we're counting down to (Year, Month (0-11), Day, Hour)
        // Note: Month is 0-indexed (0 = Jan, 9 = Oct)
        const weddingDate = new Date(2026, 8, 16, 19, 0, 0).getTime();

        // --- COUNTDOWN LOGIC ---
        const timer = setInterval(function() {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            // Time calculations
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Display the result
            document.getElementById("days").innerText = days;
            document.getElementById("hours").innerText = hours;
            document.getElementById("minutes").innerText = minutes;
            document.getElementById("seconds").innerText = seconds;

            // If the count down is finished, write some text
            if (distance < 0) {
                clearInterval(timer);
                document.getElementById("countdown").innerHTML = "<h2>¡Es hoy! ♥</h2>";
            }
        }, 1000);

        // --- RSVP BUTTON ---
        function confirmAttendance() {
            // In a real app, this would send data to a server or open a WhatsApp link
            alert("¡Gracias por confirmar! Nos vemos pronto.");
            
            // Optional: Redirect to WhatsApp
            // window.location.href = "https://wa.me/5215555555555?text=Hola%20Victoria%20y%20Abduhlla,%20confirmo%20mi%20asistencia%20a%20su%20boda!";
        }