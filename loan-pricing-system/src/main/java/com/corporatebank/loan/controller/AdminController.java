package com.corporatebank.loan.controller;

import com.corporatebank.loan.model.Loan;
import com.corporatebank.loan.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    private final LoanService service;

    @PatchMapping("/loans/{id}/decision")
    public Loan decision(
            @PathVariable String id,
            @RequestParam boolean approved,
            @RequestParam(required = false) Double amount,
            @RequestParam(required = false) Double rate,
            Authentication auth) {
        // ✅ Matches LoanService method
        return service.approve(id, auth.getName(), amount, rate, approved);
    }
    
    @DeleteMapping("/loans/{id}")
    public void delete(@PathVariable String id, Authentication auth) {
        service.softDelete(id, auth.getName());
    }
}