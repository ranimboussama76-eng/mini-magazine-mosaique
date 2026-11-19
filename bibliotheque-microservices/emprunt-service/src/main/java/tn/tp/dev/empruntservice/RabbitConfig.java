package tn.tp.dev.empruntservice;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String QUEUE = "emprunt-queue";

    // Cree la file "emprunt-queue" dans RabbitMQ si elle n'existe pas
    @Bean
    public Queue empruntQueue() {
        return new Queue(QUEUE);
    }
}
