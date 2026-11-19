package tn.tp.dev.notificationservice;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationListener listener;

    public NotificationController(NotificationListener listener) {
        this.listener = listener;
    }

    @GetMapping
    public List<String> getNotifications() {
        return listener.getNotifications();
    }
}
