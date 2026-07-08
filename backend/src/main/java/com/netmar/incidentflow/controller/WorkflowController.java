package com.netmar.incidentflow.controller;

import com.netmar.incidentflow.model.Workflow;
import com.netmar.incidentflow.service.WorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<Workflow> getAllWorkflows() {
        return workflowService.getAllWorkflows();
    }

    @GetMapping("/{id}")
    public Workflow getWorkflowById(@PathVariable Long id) {
        return workflowService.getWorkflowById(id);
    }

    @GetMapping("/category/{category}")
    public Workflow getWorkflowByCategory(@PathVariable String category) {
        return workflowService.getWorkflowByCategory(category);
    }

    @PostMapping
    public Workflow createWorkflow(@RequestBody Workflow workflow) {
        return workflowService.saveWorkflow(workflow);
    }

    @PutMapping("/{id}")
    public Workflow updateWorkflow(@PathVariable Long id, @RequestBody Workflow workflowDetails) {
        Workflow workflow = workflowService.getWorkflowById(id);
        workflow.setName(workflowDetails.getName());
        workflow.setCategory(workflowDetails.getCategory());
        workflow.setActive(workflowDetails.isActive());
        workflow.setStates(workflowDetails.getStates());
        workflow.setTransitions(workflowDetails.getTransitions());
        return workflowService.saveWorkflow(workflow);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkflow(@PathVariable Long id) {
        workflowService.deleteWorkflow(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}
