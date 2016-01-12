package dev.zygimantas;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Version;

@Data
@Entity
public class User {

    private @Id
    @GeneratedValue
    Long id;
    private String email;

    private @Version @JsonIgnore Long version;

    private User() {}

    public User(String email) {
        this.email = email;
    }
}
