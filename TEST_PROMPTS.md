# AI Visualization Test Prompts

## Pie Chart Prompts
Test the pie chart visualization with these prompts:

1. **Deal Distribution by Stage**
   - "Show me deal distribution by stage as a pie chart"
   - "Display opportunity breakdown by pipeline stage in a pie"
   - "What percentage of deals are in each stage?"

2. **Customer Segmentation**
   - "Show customer distribution by industry as a pie chart"
   - "Display account breakdown by type in a pie"
   - "What's the distribution of customers by region?"

3. **Revenue Distribution**
   - "Show revenue distribution by product category as a pie chart"
   - "Display sales breakdown by team in a pie"
   - "What percentage of revenue comes from each source?"

## Bar Chart Prompts
Test the bar chart visualization with these prompts:

1. **Sales Performance Comparison**
   - "Show me sales by owner as a bar chart"
   - "Compare revenue by month in a bar chart"
   - "Display deal count by sales rep as bars"

2. **Product Performance**
   - "Show product sales comparison as a bar chart"
   - "Compare revenue by product category in bars"
   - "Display top 10 products by revenue in a bar chart"

3. **Regional Analysis**
   - "Show sales by region as a bar chart"
   - "Compare performance across territories in bars"
   - "Display customer count by country as a bar chart"

## Line Chart Prompts
Test the line chart visualization with these prompts:

1. **Trend Analysis**
   - "Show me sales trend over the last 12 months as a line chart"
   - "Display monthly revenue progression as a line"
   - "What's the deal closure trend over time?"

2. **Growth Tracking**
   - "Show customer growth over time as a line chart"
   - "Display pipeline value trend by month"
   - "Track deal velocity over the last quarter as a line"

3. **Performance Timeline**
   - "Show revenue timeline for this year as a line chart"
   - "Display conversion rate trend over months"
   - "What's the monthly sales progression?"

## Table Prompts
Test the table visualization with these prompts:

1. **Detailed Deal Lists**
   - "Show me all deals in a table format"
   - "List top 10 opportunities with details"
   - "Display all open deals as a table"

2. **Customer Information**
   - "Show me all customers in a table"
   - "List accounts with their details in table format"
   - "Display customer contact information as a table"

3. **Sales Reports**
   - "Show me sales summary by rep in a table"
   - "List all deals closed this month with details"
   - "Display pipeline report in table format"

## Scatter Plot Prompts
Test the scatter plot visualization with these prompts:

1. **Correlation Analysis**
   - "Show relationship between deal value and days in pipeline as a scatter plot"
   - "Display correlation between account size and revenue as scatter"
   - "What's the relationship between discount and deal size?"

2. **Performance Metrics**
   - "Show deal value vs probability as a scatter plot"
   - "Display customer lifetime value vs acquisition cost"
   - "Plot revenue vs number of activities as scatter"

3. **Efficiency Analysis**
   - "Show time to close vs deal size as a scatter plot"
   - "Display sales cycle length vs deal value"
   - "What's the correlation between team size and revenue?"

## Complex Multi-Data Prompts
Test complex queries that combine multiple features:

1. **Advanced Analytics**
   - "Show me top 5 performing sales reps with their monthly trend"
   - "Compare this year's revenue to last year by quarter"
   - "What are the best performing products by region?"

2. **Predictive Insights**
   - "Which deals are most likely to close this month?"
   - "What's the projected revenue for next quarter?"
   - "Show pipeline health metrics with trends"

3. **Executive Dashboard**
   - "Give me a complete sales overview for this quarter"
   - "Show key performance indicators with visualizations"
   - "What's the overall business health status?"

## Data-Specific Prompts
Test with actual data queries:

1. **Numeric Aggregations**
   - "What's the total revenue this year?"
   - "How many deals did we close last month?"
   - "What's the average deal size?"

2. **Filtering and Sorting**
   - "Show me deals worth over $10,000"
   - "List opportunities closing this week"
   - "What are the top 5 largest accounts?"

3. **Date-Based Queries**
   - "Show me all activities from last week"
   - "What deals were created today?"
   - "Display this month's performance metrics"

## Testing Tips

1. **Start Simple**: Begin with basic queries to ensure the system understands your data
2. **Be Specific**: Include visualization type when you want a particular chart
3. **Use Natural Language**: The AI understands conversational queries
4. **Iterate**: If the first result isn't perfect, refine your query
5. **Combine Features**: Try asking for multiple metrics in one query

## Expected Behaviors

- **Pie Charts**: Best for showing parts of a whole, percentages, distributions
- **Bar Charts**: Ideal for comparisons between categories
- **Line Charts**: Perfect for trends over time, progressions
- **Tables**: Great for detailed data, lists, comprehensive views
- **Scatter Plots**: Excellent for correlations, relationships between variables

## Troubleshooting

If a visualization doesn't appear:
1. Check if you're logged in (token in localStorage)
2. Ensure the backend is running (port 4000)
3. Look for console errors in browser DevTools
4. Try a simpler query first
5. Verify data exists for your query

## Sample Conversation Flow

```
You: "Show me deal distribution by stage as a pie chart"
AI: [Displays pie chart with deal stages]

You: "What are the exact numbers?"
AI: [Shows detailed breakdown with counts]

You: "Now show me the trend over the last 6 months"
AI: [Displays line chart with monthly progression]

You: "List the top 10 deals in a table"
AI: [Shows table with deal details]
```