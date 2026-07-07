package com.netmar.incidentflow.controller;

import com.netmar.incidentflow.model.Role;
import com.netmar.incidentflow.model.User;
import com.netmar.incidentflow.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/users/me")
    public User getCurrentUser() {
        return userService.getCurrentUser();
    }

    @GetMapping("/roles")
    public List<Role> getRoles() {
        return userService.getAllRoles();
    }
}
