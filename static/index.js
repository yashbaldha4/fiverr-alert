const check = () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("No Service Worker support!")
    }
    if (!("PushManager" in window)) {
      throw new Error("No Push API Support!")
    }
}

const displayNotification = (acc) => {
    if (Notification.permission == "granted") {
        navigator.serviceWorker.getRegistration().then(function(reg) {
        reg.showNotification("You have a new notification ",
            {vibrate: [100, 50, 100], icon: acc})
        })
    }
}

const main = async () => {
    const audio = new Audio("sound.mp3")
    audio.setAttribute("loop", "loop")

    let DEVICES = []
    
    const mute = e => {
        if (e.target.innerText === "Pause Alarm") {
            audio.pause()
        } else {
            e.target.innerText = "Pause Alarm"
        }
    }
    document.querySelector("#mute").addEventListener("click", mute)

    const socket = io()
    socket.emit("initialize")

    const renderTable = () => {
        const container = document.querySelector("#table-container")
        const table = document.createElement("table")
        const headers = document.createElement("tr")
        const cols = ["Account", "Unread Messages", "Remove"]

        cols.forEach(col => {
            const th = document.createElement("th")
            th.innerText = col
            headers.appendChild(th)
        })
        table.appendChild(headers)

        DEVICES.forEach((record, i) => {
            if (!record || !record[2]) { return }
            const row = document.createElement("tr")
            row.setAttribute("data-row", i)
            record.forEach((el, i) => {
                if (i === 2) { return }
                const td = document.createElement("td")
                if (i === 0) {
                    const img = document.createElement("img")
                    img.setAttribute("src", el)
                    img.setAttribute("alt", "")
                    td.appendChild(img)
                } else {
                    td.innerText = el
                }
                row.appendChild(td)
            })

            const button = document.createElement("button")
            button.innerText = "X"
            button.setAttribute("class", "btn btn-outline-danger")
            button.addEventListener("click", e => {
                const toDelete = e.target.parentNode.parentNode
                const index = parseInt(toDelete.dataset.row)
                socket.emit("delete", {"i": index})
                DEVICES[index][2] = false
                renderTable()
            })

            const td = document.createElement("td")
            td.appendChild(button)
            row.appendChild(td)
            table.appendChild(row)
        })
        if (!DEVICES.filter(d => d[2]).length) { audio.pause() }
        table.setAttribute("class", "table table-bordered")
        container.firstChild.replaceWith(table)
    }

    const reset = e => {
        e.preventDefault()
        DEVICES = []
        socket.emit("reset")
        audio.pause()
        renderTable()
    }
    document.querySelector("#reset").addEventListener("click", reset)

    document.querySelector("#logout").addEventListener("click", () => {
        fetch("/logout", { method: "POST" }).then(() => window.location.reload())
    })

    socket.on("start", devices => {
        if (devices && devices.length > 0) {
            DEVICES = devices
            setTimeout(() => {
                devices.forEach(d => {
                    if (d[2] === true) {
                        if (Notification.permission == "granted") { displayNotification(d[0]) }
                        audio.play()
                    }
                })
                renderTable()
            }, 5000)
        }
    })

    socket.on("alert", devices => {
        DEVICES = devices
        if (Notification.permission == "granted") {
            devices.filter(d => d[2]).forEach(dev => displayNotification(dev[0]))
        }
        renderTable()
        audio.play()
    })
}

window.addEventListener("load", () => {
    if( !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        check()
        navigator.serviceWorker
        .register("/service.js")
        .then(() =>  { console.log("Service Worker Registered") })
        Notification.requestPermission(function(status) {
            console.log("Notification permission status:", status)
        })
    }
    main()
})
