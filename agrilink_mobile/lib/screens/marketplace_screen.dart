import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../localization/app_locale.dart';
import '../widgets/shimmer_loading.dart';
import '../widgets/empty_state.dart';
import '../widgets/ad_banner.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cropController = TextEditingController();
  final _quantityController = TextEditingController();
  final _priceController = TextEditingController();

  bool _isSubmitting = false;
  Map<String, dynamic>? _pricePrediction;
  List<dynamic> _myListings = [];
  bool _isLoadingListings = true;
  String _farmerId = "";

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _farmerId = await AuthService.getUserId() ?? "";
    _loadListings();
  }

  Future<void> _loadListings() async {
    if (_farmerId.isEmpty) return;
    setState(() => _isLoadingListings = true);
    final result = await ApiService.getMyListings(_farmerId);
    setState(() {
      _myListings = result["success"] == true ? (result["data"] as List) : [];
      _isLoadingListings = false;
    });
  }

  Future<void> _checkPricePrediction() async {
    if (_cropController.text.trim().isEmpty) return;
    final result = await ApiService.getPricePrediction(_cropController.text.trim());
    if (result["success"] == true) {
      setState(() => _pricePrediction = result["data"]);
    } else {
      setState(() => _pricePrediction = null);
    }
  }

  Future<void> _submitListing() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    final result = await ApiService.createMarketplaceListing(
      farmerId: _farmerId,
      cropType: _cropController.text.trim(),
      quantityKg: double.parse(_quantityController.text),
      pricePerKg: double.parse(_priceController.text),
      harvestDate: DateTime.now().add(const Duration(days: 7)),
    );

    setState(() => _isSubmitting = false);

    if (!mounted) return;

    if (result["success"] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Listing created successfully!")),
      );
      _cropController.clear();
      _quantityController.clear();
      _priceController.clear();
      setState(() => _pricePrediction = null);
      _loadListings();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed: ${result["message"] ?? "Could not reach server. Is the backend running?"}")),
      );
    }
  }

  Future<void> _openEditDialog(Map<String, dynamic> listing) async {
    final t = AppLocale.instance.t;
    final quantityController = TextEditingController(text: "${listing["quantityKg"]}");
    final priceController = TextEditingController(text: "${listing["currentPricePerKg"]}");
    String qualityGrade = listing["qualityGrade"] ?? "A";

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: Text("${t("editListing")} — ${listing["cropType"]}"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: quantityController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: t("quantityKg")),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: priceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: t("askingPrice")),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: qualityGrade,
                  decoration: const InputDecoration(labelText: "Quality grade"),
                  items: ["A", "B", "C"].map((g) => DropdownMenuItem(value: g, child: Text("Grade $g"))).toList(),
                  onChanged: (v) => setDialogState(() => qualityGrade = v ?? "A"),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t("cancel"))),
            ElevatedButton(onPressed: () => Navigator.pop(context, true), child: Text(t("saveChanges"))),
          ],
        ),
      ),
    );

    if (saved != true) return;
    final quantity = double.tryParse(quantityController.text);
    final price = double.tryParse(priceController.text);
    if (quantity == null || price == null) return;

    final result = await ApiService.updateMarketplaceListing(
      listingId: listing["_id"],
      farmerId: _farmerId,
      quantityKg: quantity,
      pricePerKg: price,
      qualityGrade: qualityGrade,
    );

    if (!mounted) return;
    if (result["success"] == true) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t("listingUpdated"))));
      _loadListings();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result["message"] ?? "Failed to update listing.")));
    }
  }

  Future<void> _markAsSold(Map<String, dynamic> listing) async {
    final t = AppLocale.instance.t;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(t("markAsSold")),
        content: Text(t("markAsSoldConfirm")),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t("cancel"))),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: Text(t("markAsSold"))),
        ],
      ),
    );
    if (confirmed != true) return;

    final result = await ApiService.completeSale(listingId: listing["_id"], confirmedByUserId: _farmerId);
    if (!mounted) return;
    if (result["success"] == true) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t("saleCompleted"))));
      _loadListings();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result["message"] ?? "Failed to complete sale.")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppLocale.instance,
      builder: (context, _) {
        final t = AppLocale.instance.t;
        return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AdBanner(),
          Text(t("listYourHarvest"), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _cropController,
                  decoration: InputDecoration(labelText: t("cropTypeLabel"), border: const OutlineInputBorder()),
                  onChanged: (_) => _checkPricePrediction(),
                  validator: (v) => (v == null || v.isEmpty) ? "Required" : null,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _quantityController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: t("quantityKg"), border: const OutlineInputBorder()),
                  validator: (v) => (v == null || double.tryParse(v) == null) ? "Enter a valid number" : null,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _priceController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: t("askingPrice"), border: const OutlineInputBorder()),
                  validator: (v) => (v == null || double.tryParse(v) == null) ? "Enter a valid number" : null,
                ),
                if (_pricePrediction != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(8)),
                    child: Text(
                      "AI market prediction: LKR ${_pricePrediction!["predictedPricePerKg"]}/kg "
                      "(confidence: ${_pricePrediction!["confidence"]})\n"
                      "This is a suggestion — you set the final asking price above.",
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitListing,
                    style: ElevatedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(t("listOnMarketplace")),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(t("myListings"), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_isLoadingListings)
            const Column(children: [ShimmerCard(), ShimmerCard()])
          else if (_myListings.isEmpty)
            EmptyState(icon: Icons.inventory_2_outlined, title: t("noListingsYet"))
          else
            ..._myListings.map((listing) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text("${listing["cropType"]} — ${listing["quantityKg"]}kg",
                                  style: const TextStyle(fontWeight: FontWeight.w600)),
                            ),
                            Chip(
                              label: Text(listing["status"], style: const TextStyle(fontSize: 11)),
                              backgroundColor: listing["tier"] == "secondary" ? Colors.orange[100] : Colors.green[100],
                            ),
                          ],
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 4, bottom: 6),
                          child: Text("LKR ${listing["currentPricePerKg"]}/kg • Tier: ${listing["tier"]}",
                              style: const TextStyle(fontSize: 12.5, color: Colors.black54)),
                        ),
                        if (listing["status"] == "listed" || listing["status"] == "reserved")
                          Row(
                            children: [
                              if (listing["status"] == "listed")
                                TextButton.icon(
                                  onPressed: () => _openEditDialog(listing),
                                  icon: const Icon(Icons.edit_rounded, size: 15),
                                  label: Text(t("editListing"), style: const TextStyle(fontSize: 12.5)),
                                ),
                              if (listing["status"] == "reserved")
                                TextButton.icon(
                                  onPressed: () => _markAsSold(listing),
                                  icon: const Icon(Icons.check_circle_outline_rounded, size: 15),
                                  label: Text(t("markAsSold"), style: const TextStyle(fontSize: 12.5)),
                                ),
                            ],
                          ),
                      ],
                    ),
                  ),
                )),
        ],
      ),
    );
      },
    );
  }
}
