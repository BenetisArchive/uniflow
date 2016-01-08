package dev.zygimantas;

import org.springframework.data.repository.CrudRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

public interface UserRepository extends CrudRepository<User, Long> {
}
