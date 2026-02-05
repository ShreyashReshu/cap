package com.corporatebank.loan.repository;

import com.corporatebank.loan.model.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LoanRepository extends MongoRepository<Loan, String> {
    Page<Loan> findByDeletedFalse(Pageable pageable);
    Optional<Loan> findByIdAndDeletedFalse(String id);
}
