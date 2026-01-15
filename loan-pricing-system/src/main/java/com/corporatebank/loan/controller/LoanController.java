package com.corporatebank.loan.controller;

import com.corporatebank.loan.model.Loan;
import com.corporatebank.loan.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200") // Allow Angular
public class LoanController {

    private final LoanService service;

    @PostMapping
    public Loan create(@RequestBody Loan loan, Authentication auth) {
        return service.createLoan(loan, auth.getName());
    }

    @GetMapping
    public Page<Loan> list(Pageable pageable) {
        return service.getAllLoans(pageable);
    }

    @GetMapping("/{id}")
    public Loan getOne(@PathVariable String id) {
        return service.getLoan(id);
    }

    @PutMapping("/{id}")
    public Loan update(@PathVariable String id, @RequestBody Loan loan, Authentication auth) {
        return service.updateLoan(id, loan, auth.getName());
    }

    @PatchMapping("/{id}/submit")
    public Loan submit(@PathVariable String id, Authentication auth) {
        return service.submit(id, auth.getName());
    }
}
