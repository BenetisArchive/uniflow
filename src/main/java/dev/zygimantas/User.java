package dev.zygimantas;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Data
@Entity
public class User {

    private @Id
    @GeneratedValue
    Long id;
    private String email;

    private User() {}

    public User(String email) {
        this.email = email;
    }
}
