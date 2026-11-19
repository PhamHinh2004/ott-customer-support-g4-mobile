package com.chatapp.config;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.model.*;
import com.amazonaws.services.dynamodbv2.util.TableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
@RequiredArgsConstructor
public class DynamoDBTableInitializer implements CommandLineRunner {

    private final AmazonDynamoDB amazonDynamoDB;
    private final DynamoDBMapper dynamoDBMapper;

    @Value("${aws.dynamodb.auto-create-tables:true}")
    private boolean autoCreateTables;

    @Value("${aws.dynamodb.billing-mode:PAY_PER_REQUEST}")
    private String billingMode;

    @Override
    public void run(String... args) {
        if (!autoCreateTables) {
            log.info("DynamoDB auto-create-tables is disabled.");
            return;
        }

        log.info("Scanning for DynamoDB entities to initialize tables...");
        
        List<Class<?>> entityClasses = getEntityClasses();

        for (Class<?> clazz : entityClasses) {
            createTableIfNotExists(clazz);
        }
    }

    private List<Class<?>> getEntityClasses() {
        List<Class<?>> classes = new ArrayList<>();
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable.class));

        for (org.springframework.beans.factory.config.BeanDefinition bd : scanner.findCandidateComponents("com.chatapp")) {
            try {
                classes.add(Class.forName(bd.getBeanClassName()));
            } catch (ClassNotFoundException e) {
                log.error("Could not load class {}", bd.getBeanClassName(), e);
            }
        }
        return classes;
    }

    private void createTableIfNotExists(Class<?> clazz) {
        try {
            CreateTableRequest request = dynamoDBMapper.generateCreateTableRequest(clazz);
            
            // Set billing mode
            request.setBillingMode(billingMode);
            
            // If PAY_PER_REQUEST, remove ProvisionedThroughput since it's not applicable
            if (BillingMode.PAY_PER_REQUEST.toString().equals(billingMode)) {
                request.setProvisionedThroughput(null);
                if (request.getGlobalSecondaryIndexes() != null) {
                    for (GlobalSecondaryIndex gsi : request.getGlobalSecondaryIndexes()) {
                        gsi.setProvisionedThroughput(null);
                    }
                }
            }

            String tableName = request.getTableName();

            // Check if table exists
            try {
                DescribeTableResult describeResult = amazonDynamoDB.describeTable(tableName);
                log.info("DynamoDB Table {} already exists. Status: {}", 
                    tableName, describeResult.getTable().getTableStatus());
            } catch (ResourceNotFoundException e) {
                log.info("Creating DynamoDB Table: {}", tableName);
                amazonDynamoDB.createTable(request);
                log.info("Successfully requested creation of table: {}", tableName);
                try {
                    TableUtils.waitUntilActive(amazonDynamoDB, tableName, 15000, 1000);
                    log.info("DynamoDB Table {} is now ACTIVE", tableName);
                } catch (Exception waitEx) {
                    log.warn("Table {} creation requested, wait status: {}", tableName, waitEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to create table for entity {}", clazz.getSimpleName(), e);
        }
    }
}
