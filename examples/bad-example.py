# Example Python file with various code quality issues
# This file demonstrates the types of issues the automated code review will catch

import os
import sys
import json  # Issue: Unused import

# Issue: Line too long - this comment intentionally exceeds the maximum length limit of 120 characters to demonstrate the line length check functionality

# Issue: Function name doesn't follow snake_case
def Calculate_Total(items):
    # Issue: Non-descriptive variable names
    t = 0
    for i in items:
        t += i['price']
    return t

# Issue: Function too long (would need more lines to trigger in real scenario)
def process_data(data):
    """Process data with many steps."""
    # Issue: Duplicate code pattern
    results = []
    for item in data:
        if item['status'] == 'active':
            processed_item = {
                'id': item['id'],
                'name': item['name'],
                'value': item['value'] * 1.1
            }
            results.append(processed_item)
    return results

# Issue: Duplicate code pattern (similar to above)
def filter_data(data):
    """Filter and transform data."""
    filtered = []
    for item in data:
        if item['status'] == 'pending':
            transformed_item = {
                'id': item['id'],
                'name': item['name'],
                'value': item['value'] * 1.2
            }
            filtered.append(transformed_item)
    return filtered

# Issue: Complex function (high cyclomatic complexity)
def complex_calculation(x, y, z):
    """Perform complex calculations."""
    if x > 0:
        if y > 0:
            if z > 0:
                if x > y:
                    if y > z:
                        if x > z:
                            return x * y * z
                        else:
                            return x + y + z
                    else:
                        return x - y - z
                else:
                    return y * z
            else:
                return x + y
        else:
            return x
    else:
        return 0

# Issue: Using global variables
global_counter = 0

def increment_counter():
    """Increment global counter."""
    global global_counter
    global_counter += 1
    return global_counter

# Issue: Not using proper exception handling
def risky_function(filename):
    """Read file without proper error handling."""
    file = open(filename, 'r')  # Should use 'with' statement
    content = file.read()
    file.close()
    return content

# Issue: Magic numbers
def calculate_shipping_cost(weight):
    """Calculate shipping cost."""
    if weight > 10:
        return weight * 2.5  # What does 2.5 represent?
    elif weight > 5:
        return weight * 1.8  # What does 1.8 represent?
    else:
        return 5.0  # What does 5.0 represent?

# Issue: Class name should be PascalCase
class user_manager:
    """Manage users."""
    
    def __init__(self):
        self.users = []
    
    # Issue: Method name with typo
    def add_usr(self, user):
        """Add user to the list."""
        self.users.append(user)
    
    # Issue: Single letter variable
    def get_user_by_id(self, id):
        """Get user by ID."""
        for u in self.users:  # Issue: Non-descriptive variable
            if u['id'] == id:
                return u
        return None

# Good example: Well-written function
def calculate_tax_amount(price, tax_rate):
    """
    Calculate tax amount for a given price and tax rate.
    
    Args:
        price (float): The original price
        tax_rate (float): Tax rate as a percentage (e.g., 8.5 for 8.5%)
    
    Returns:
        float: The calculated tax amount
    """
    MINIMUM_TAXABLE_AMOUNT = 0.01
    
    if price < MINIMUM_TAXABLE_AMOUNT:
        return 0.0
    
    return price * (tax_rate / 100.0)

# Good example: Proper file handling
def read_config_file(filename):
    """
    Read configuration from JSON file.
    
    Args:
        filename (str): Path to the configuration file
        
    Returns:
        dict: Configuration data
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        raise FileNotFoundError(f"Configuration file not found: {filename}")
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"Invalid JSON in configuration file: {e}")

if __name__ == "__main__":
    # Example usage
    config = read_config_file('config.json')
    tax_amount = calculate_tax_amount(100.0, 8.5)
    print(f"Tax amount: ${tax_amount:.2f}")
