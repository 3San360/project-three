// Example JavaScript file with various code quality issues
// This file demonstrates the types of issues the automated code review will catch

// Issue: Using var instead of let/const
var userName = 'john_doe';

// Issue: Console statement (should be removed in production)
console.log('Debug message');

// Issue: Unused variable
let unusedVariable = 'this will never be used';

// Issue: Function name doesn't follow camelCase
function User_Manager() {
    // Issue: Function too long (would need more lines to trigger)
    let a = 1; // Issue: Non-descriptive variable name
    let b = 2; // Issue: Non-descriptive variable name
    let c = 3; // Issue: Non-descriptive variable name
    
    // Issue: Line too long - this line intentionally exceeds the maximum length limit of 120 characters to demonstrate the line length check
    
    // Issue: No return statement (inconsistent)
    if (a > b) {
        return a + b + c;
    }
    // Missing return for other cases
}

// Issue: Duplicate code pattern
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price;
    }
    return total;
}

// Issue: Duplicate code pattern (similar to above)
function calculateSum(values) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        sum += values[i].amount;
    }
    return sum;
}

// Issue: Complex function (high cyclomatic complexity)
function complexFunction(x, y, z) {
    if (x > 0) {
        if (y > 0) {
            if (z > 0) {
                if (x > y) {
                    if (y > z) {
                        if (x > z) {
                            return x * y * z;
                        } else {
                            return x + y + z;
                        }
                    } else {
                        return x - y - z;
                    }
                } else {
                    return y * z;
                }
            } else {
                return x + y;
            }
        } else {
            return x;
        }
    } else {
        return 0;
    }
}

// Issue: Using eval (security risk)
function dangerousFunction(code) {
    return eval(code);
}

// Issue: Magic numbers
function calculateDiscount(price) {
    if (price > 100) {
        return price * 0.1; // What does 0.1 represent?
    } else if (price > 50) {
        return price * 0.05; // What does 0.05 represent?
    }
    return 0;
}

// Good example: Well-written function
function calculateDiscountedPrice(originalPrice, discountPercentage) {
    const MINIMUM_PRICE_FOR_DISCOUNT = 10;
    
    if (originalPrice < MINIMUM_PRICE_FOR_DISCOUNT) {
        return originalPrice;
    }
    
    const discountAmount = originalPrice * (discountPercentage / 100);
    return originalPrice - discountAmount;
}

// Export for use in other modules
export { calculateDiscountedPrice, complexFunction };
