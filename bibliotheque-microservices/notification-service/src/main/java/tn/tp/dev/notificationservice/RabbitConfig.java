package tn.tp.dev.notificationservice;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String QUEUE = "emprunt-queue";

    @Bean
    public Queue empruntQueue() {
        return new Queue(QUEUE);
    }
}
