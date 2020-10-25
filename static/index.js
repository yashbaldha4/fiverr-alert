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
        reg.showNotification("A new notification at " + acc , {vibrate: [100, 50, 100]})
        })
    }
}


const renderTable = arr => {
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

    arr.forEach((record, i) => {
        if (!record) { return }
        const row = document.createElement("tr")
        row.setAttribute("data-row", i)
        record.forEach(el => {
            const td = document.createElement("td")
            td.innerText = el
            row.appendChild(td)
        })
        const button = document.createElement("button")
        button.innerText = "X"
        const td = document.createElement("td")
        td.appendChild(button)
        row.appendChild(td)
        table.appendChild(row)
    })

    container.firstChild.replaceWith(table)
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

    document.querySelector("#mute").addEventListener("click", e => {
        if (e.target.innerText === "Pause Alarm") {
            audio.pause()
        } else {
            e.target.innerText = "Pause Alarm"
        }
    })

    const socket = io()
    socket.emit("initialize")

    document.querySelector("#reset").addEventListener("click", () => {
        socket.emit("reset")
        renderTable([])
    })

    socket.on("start", devices => {
        if (devices && devices.length > 0) {
            setTimeout(() => {
                displayNotification(devices[devices.length - 1][0])
                renderTable(devices)
                audio.play()
            }, 5000)
        }
    })

    socket.on("alert", devices => {
        displayNotification(devices[devices.length - 1][0])
        renderTable(devices)
        audio.play()
    })
}

main()
