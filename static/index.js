const check = () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error('No Service Worker support!')
    }
    if (!("PushManager" in window)) {
      throw new Error('No Push API Support!')
    }
}

const displayNotification = (acc) => {
    if (Notification.permission == 'granted') {
        navigator.serviceWorker.getRegistration().then(function(reg) {
        reg.showNotification("New Notification at " + acc , {vibrate: [100, 50, 100]})
        })
    }
}

const main = async () => {
    check()
    navigator.serviceWorker
    .register('/service.js')
    .then(() =>  { console.log("Service Worker Registered") })
    Notification.requestPermission(function(status) {
        console.log('Notification permission status:', status)
    })

    const audio = new Audio("sound.mp3")
    audio.setAttribute("loop", "loop")

    let DEVICES = []
    
    const mute = e => {
        // document.querySelector("#mute").removeEventListener("click", mute)
        // document.querySelector("#mute").removeEventListener("touchstart", mute)
        if (e.target.innerText === "Pause Alarm") {
            audio.pause()
        } else {
            e.target.innerText = "Pause Alarm"
        }
    }

    window.addEventListener("touchend", event => {
        const el = document.querySelector("#mute")
        if (el.target.innerText === "Pause Alarm") {
            audio.pause()
        } else {
            el.target.innerText = "Pause Alarm"
        }
    })

    document.querySelector("#mute").addEventListener("click", mute)
    // document.querySelector("#mute").addEventListener("touchstart", e => mute)
    document.querySelector("#mute").addEventListener("touchend", mute)


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
                td.innerText = el
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
        table.setAttribute("class", "table table-bordered")
        container.firstChild.replaceWith(table)
    }

    const reset = e => {
        DEVICES = []
        socket.emit("reset")
        audio.pause()
        renderTable()
    }

    document.querySelector("#reset").addEventListener("click", reset)
    // document.querySelector("#reset").addEventListener("touchstart", reset)
    document.querySelector("#reset").addEventListener("touchend", reset)

    document.querySelector("#logout").addEventListener("click", () => {
        fetch("/logout", { method: "POST" }).then(() => window.location.reload())
    })

    socket.on("start", devices => {
        if (devices && devices.length > 0) {
            DEVICES = devices
            setTimeout(() => {
                devices.forEach(d => {
                    if (d[2] === true) {
                        displayNotification(d[0])
                        audio.play()
                    }
                })
                renderTable()
            }, 5000)
        }
    })

    socket.on("alert", devices => {
        DEVICES = devices
        displayNotification(devices[devices.length - 1][0])
        renderTable()
        audio.play()
    })
}

main()
