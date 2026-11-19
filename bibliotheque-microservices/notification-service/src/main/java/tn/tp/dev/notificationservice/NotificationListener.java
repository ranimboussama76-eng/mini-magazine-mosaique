package tn.tp.dev.notificationservice;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class NotificationListener {

    private final List<String> notifications = new ArrayList<>();

    // Appelee automatiquement a chaque message arrive dans "emprunt-queue"
    @RabbitListener(queues = RabbitConfig.QUEUE)
    public void recevoir(String message) {
        System.out.println("NOTIFICATION ENVOYEE : " + message);
        notifications.add(message);
    }

    public List<String> getNotifications() {
        return notifications;
    }
}
