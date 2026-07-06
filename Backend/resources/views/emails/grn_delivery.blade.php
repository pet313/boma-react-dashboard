<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KMC Goods Received Note</title>
    <style>
        body { font-family: Arial, sans-serif; color: #222; margin: 0; padding: 0; background: #f5f5f5; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
        .header { background: #003893; color: #fff; padding: 28px 32px; }
        .header h1 { margin: 0 0 4px; font-size: 22px; }
        .header p  { margin: 0; font-size: 13px; opacity: .85; }
        .body      { padding: 28px 32px; }
        .greeting  { font-size: 16px; margin-bottom: 16px; }
        .summary   { background: #f0f4ff; border-left: 4px solid #003893; border-radius: 4px; padding: 18px 20px; margin-bottom: 20px; }
        .summary table { width: 100%; border-collapse: collapse; }
        .summary td { padding: 6px 0; font-size: 14px; }
        .summary td:first-child { color: #555; width: 50%; }
        .summary td:last-child  { font-weight: bold; color: #003893; }
        .note   { font-size: 13px; color: #666; margin-bottom: 20px; }
        .footer { background: #003893; color: #fff; padding: 16px 32px; font-size: 12px; opacity: .9; }
        .badge  { display: inline-block; background: #C8102E; color: #fff; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <h1>Kenya Meat Commission</h1>
        <p>Goods Received Note &mdash; Official Copy</p>
    </div>

    <div class="body">
        <p class="greeting">Dear <strong>{{ $supplierName ?? 'Valued Supplier' }}</strong>,</p>

        <p style="margin-bottom:16px;">
            Your livestock consignment has been received and weighed at KMC.
            Please find your <strong>Goods Received Note (GRN)</strong> attached
            to this email as a PDF.
        </p>

        <div class="summary">
            <table>
                <tr>
                    <td>GRN Number</td>
                    <td><span class="badge">{{ $grnNumber ?? '' }}</span></td>
                </tr>
                <tr>
                    <td>MOB Number</td>
                    <td>{{ $mobNumber ?? '' }}</td>
                </tr>
                <tr>
                    <td>Date Received</td>
                    <td>{{ $receivedDate ?? '' }}</td>
                </tr>
                <tr>
                    <td>Total Animals</td>
                    <td>{{ $totalAnimals ?? 0 }} head(s)</td>
                </tr>
                <tr>
                    <td>Total Live Weight</td>
                    <td>{{ $totalWeight ?? '0.000' }} KG</td>
                </tr>
                <tr>
                    <td>Measuring Officer</td>
                    <td>{{ $officer ?? '' }}</td>
                </tr>
            </table>
        </div>

        <p class="note">
            The attached PDF is your a system produced GRN and make lack authorising signatures and stamps. Your can pick a signed copy from the commision's Livestock department.
            If you have any queries regarding this consignment, kindly contact the
            KMC Livestock Department quoting your GRN number above.
        </p>

        <p class="note">
            <strong>Note:</strong> This is an auto-generated email.
            Please do not reply directly to this message.
        </p>
    </div>

    <div class="footer">
        Kenya Meat Commission &mdash; Livestock Tracking System &mdash; {{ date('Y') }}
    </div>
</div>
</body>
</html>
