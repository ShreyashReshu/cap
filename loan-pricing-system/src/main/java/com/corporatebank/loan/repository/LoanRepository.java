package com.corporatebank.loan.repository;

import com.corporatebank.loan.model.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface LoanRepository extends MongoRepository<Loan, String> {
    // Find all non-deleted loans with pagination
    Page<Loan> findByDeletedFalse(Pageable pageable);
    
    // Find one loan only if not deleted
    Optional<Loan> findByIdAndDeletedFalse(String id);
}
